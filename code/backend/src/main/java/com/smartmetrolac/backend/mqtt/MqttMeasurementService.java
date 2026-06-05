package com.smartmetrolac.backend.mqtt;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmetrolac.backend.entity.Alert;
import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Device;
import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.repository.AlertRepository;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.DeviceRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;

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
     * Expected MQTT JSON payload structure:
     * {
     *   "farmer_id": 1,
     *   "collection_center_id": 1,
     *   "drc": 35.50,
     *   "total_litres": 10.00,
     *   "total_amount": 2500.00,
     *   "temperature": 27.00,
     *   "ph_status": "normal",
     *   "tds_status": "normal",
     *   "measurement_datetime": "2026-04-18T10:00:00"
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
            BigDecimal drc = decimalValue(root, "drc", "drc_value");
            BigDecimal litres = decimalValue(root, "total_litres", "litres");
            BigDecimal payment = decimalValue(root, "total_amount", "payment_value");

            String phAlert = textOrNull(root, "ph_status", "ph_alert");
            String tdsAlert = textOrNull(root, "tds_status", "tds_alert");

            Invoice invoice = new Invoice();
            invoice.setFarmer(farmer);
            invoice.setCollectionCenter(center);
            invoice.setDevice(device);
            invoice.setMeasurementDateTime(parseDateTime(root));
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

    private BigDecimal decimalValue(JsonNode root, String... fields) {
        for (String field : fields) {
            if (root.hasNonNull(field)) {
                return root.get(field).decimalValue();
            }
        }
        return BigDecimal.ZERO;
    }

    private String textOrNull(JsonNode root, String... fields) {
        for (String field : fields) {
            if (root.hasNonNull(field)) {
                return root.get(field).asText();
            }
        }
        return null;
    }

    private LocalDateTime parseDateTime(JsonNode root) {
        String[] fields = {"measurement_datetime", "measurementDateTime"};
        for (String field : fields) {
            if (root.hasNonNull(field)) {
                try {
                    return LocalDateTime.parse(root.get(field).asText());
                } catch (Exception e) {
                    log.warn("Failed to parse {} from payload, falling back to now()", field);
                }
            }
        }
        return LocalDateTime.now();
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
