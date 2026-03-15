package com.smartmetrolac.backend.mqtt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmetrolac.backend.entity.*;
import com.smartmetrolac.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MqttMeasurementService {

    private static final Logger log = LoggerFactory.getLogger(MqttMeasurementService.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final FarmerRepository farmerRepository;
    private final CollectionCenterRepository collectionCenterRepository;
    private final DeviceRepository deviceRepository;
    private final InvoiceRepository invoiceRepository;
    private final AlertRepository alertRepository;

    public MqttMeasurementService(FarmerRepository farmerRepository,
                                  CollectionCenterRepository collectionCenterRepository,
                                  DeviceRepository deviceRepository,
                                  InvoiceRepository invoiceRepository,
                                  AlertRepository alertRepository) {
        this.farmerRepository = farmerRepository;
        this.collectionCenterRepository = collectionCenterRepository;
        this.deviceRepository = deviceRepository;
        this.invoiceRepository = invoiceRepository;
        this.alertRepository = alertRepository;
    }

    /**
     * Expected MQTT JSON payload structure (all lowercase snake_case):
     * {
     *   "temperature": 29.4,
     *   "ph": 7.1,
     *   "ph_alert": "normal" | "warning" | "critical",
     *   "tds_value": 1200,
     *   "tds_alert": "normal" | "warning" | "critical",
     *   "drc_value": 32.1,
     *   "litres": 12.5,
     *   "farmer_id": 1,
     *   "collection_center_id": 1,
     *   "company_id": 1,
     *   "payment_value": 3410.62
     * }
     */
    @Transactional
    public void handleRawPayload(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);

            long farmerId = readLong(root, "farmer_id", "farmerId", "f_id", "farmer");
            long collectionCenterId = readLong(root, "collection_center_id", "collectionCenterId", "cc_id", "collection_center");

            if (farmerId <= 0 || collectionCenterId <= 0) {
                log.warn("Skipping MQTT message: invalid IDs in payload. farmerId={}, collectionCenterId={}, payload={}", farmerId, collectionCenterId, payload);
                return;
            }

            Optional<Farmer> farmerOpt = farmerRepository.findById(farmerId);
            Optional<CollectionCenter> centerOpt = collectionCenterRepository.findById(collectionCenterId);

            if (farmerOpt.isEmpty() || centerOpt.isEmpty()) {
                log.warn("Skipping MQTT message: unknown farmer ({}) or collection center ({}). Ensure master records exist in DB.", farmerId, collectionCenterId);
                return;
            }

            Farmer farmer = farmerOpt.get();
            CollectionCenter center = centerOpt.get();

            // Resolve or create a device for this center (simple strategy: first device or auto-create one)
            Device device = resolveDeviceForCenter(center);

            BigDecimal temperature = decimalValue(root, "temperature");
            BigDecimal drc = decimalValue(root, "drc_value");
            BigDecimal litres = decimalValue(root, "litres");
            BigDecimal payment = decimalValue(root, "payment_value");

            String phAlert = textOrNull(root, "ph_alert");
            String tdsAlert = textOrNull(root, "tds_alert");

            Invoice invoice = new Invoice();
            invoice.setFarmer(farmer);
            invoice.setCollectionCenter(center);
            invoice.setDevice(device);
            invoice.setMeasurementDateTime(LocalDateTime.now());
            invoice.setDrc(drc);
            invoice.setTotalLitres(litres);
            invoice.setTotalAmount(payment);
            invoice.setTemperature(temperature);
            invoice.setPhStatus(phAlert);
            invoice.setTdsStatus(tdsAlert);

            Invoice savedInvoice = invoiceRepository.save(invoice);

            // Create alerts based on PH / TDS alert levels (anything other than "normal")
            if (phAlert != null && !"normal".equalsIgnoreCase(phAlert)) {
                createAlert(savedInvoice, "ph_alert", phAlert,
                        "pH alert from device: level=" + phAlert);
            }
            if (tdsAlert != null && !"normal".equalsIgnoreCase(tdsAlert)) {
                createAlert(savedInvoice, "tds_alert", tdsAlert,
                        "TDS alert from device: level=" + tdsAlert);
            }

            log.info("Stored invoice {} and related alerts (if any) from MQTT payload", savedInvoice.getId());
        } catch (Exception e) {
            log.error("Failed to process MQTT payload: {}", payload, e);
        }
    }

    private Device resolveDeviceForCenter(CollectionCenter center) {
        List<Device> devices = deviceRepository.findByCollectionCenter(center);
        if (!devices.isEmpty()) {
            return devices.get(0);
        }
        Device device = new Device();
        device.setCollectionCenter(center);
        return deviceRepository.save(device);
    }

    private void createAlert(Invoice invoice, String alertType, String severity, String message) {
        Alert alert = new Alert();
        alert.setInvoice(invoice);
        alert.setAlertType(alertType);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setResolved(false);
        alert.setCreatedDate(LocalDateTime.now());
        alertRepository.save(alert);
    }

    private BigDecimal decimalValue(JsonNode root, String field) {
        if (root.hasNonNull(field)) {
            return root.get(field).decimalValue();
        }
        return BigDecimal.ZERO;
    }

    private String textOrNull(JsonNode root, String field) {
        return root.hasNonNull(field) ? root.get(field).asText() : null;
    }

    private long readLong(JsonNode root, String... fields) {
        for (String field : fields) {
            if (root.has(field) && !root.get(field).isNull()) {
                JsonNode value = root.get(field);
                if (value.isNumber()) {
                    return value.asLong();
                }
                if (value.isTextual()) {
                    try {
                        return Long.parseLong(value.asText().trim());
                    } catch (NumberFormatException ignored) {
                        // Continue to next alias
                    }
                }
            }
        }
        return 0L;
    }
}
