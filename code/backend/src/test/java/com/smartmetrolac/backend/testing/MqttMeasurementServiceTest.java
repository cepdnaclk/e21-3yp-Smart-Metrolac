package com.smartmetrolac.backend.testing;

import com.smartmetrolac.backend.entity.Alert;
import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Device;
import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.mqtt.MqttMeasurementService;
import com.smartmetrolac.backend.repository.AlertRepository;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.DeviceRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MqttMeasurementServiceTest {

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private CollectionCenterRepository collectionCenterRepository;

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private AlertRepository alertRepository;

    @InjectMocks
    private MqttMeasurementService mqttMeasurementService;

    private Farmer farmer;
    private CollectionCenter center;
    private Device device;

    @BeforeEach
    void setUp() {
        farmer = new Farmer();
        farmer.setId(1L);

        center = new CollectionCenter();
        center.setId(1L);

        device = new Device();
        device.setId(5L);
        device.setCollectionCenter(center);
    }

    private void stubInvoiceSave() {
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> {
            Invoice i = inv.getArgument(0);
            i.setId(500L);
            return i;
        });
    }

    // Equivalence partitioning: a fully-populated, valid payload is parsed and persisted as an Invoice with matching fields.
    @Test
    void handleRawPayload_validPayload_savesInvoiceWithParsedFields() {
        String payload = "{\"farmer_id\":1,\"collection_center_id\":1,\"drc\":30.00,\"total_litres\":10.00," +
                "\"total_amount\":2500.00,\"temperature\":27.00,\"ph_status\":\"normal\",\"tds_status\":\"normal\"," +
                "\"measurement_datetime\":\"2026-04-18T10:00:00\"}";
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload(payload);

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        Invoice saved = captor.getValue();
        assertEquals(farmer, saved.getFarmer());
        assertEquals(center, saved.getCollectionCenter());
        assertEquals(device, saved.getDevice());
        assertEquals(0, new BigDecimal("30.00").compareTo(saved.getDrc()));
        assertEquals(0, new BigDecimal("10.00").compareTo(saved.getTotalLitres()));
        assertEquals(0, new BigDecimal("2500.00").compareTo(saved.getTotalAmount()));
        assertEquals(LocalDateTime.parse("2026-04-18T10:00:00"), saved.getMeasurementDateTime());
        verify(alertRepository, never()).save(any(Alert.class));
    }

    // Error/boundary case: malformed JSON is caught internally by the service and must never propagate or touch repositories.
    @Test
    void handleRawPayload_malformedJson_isCaughtAndNoRepositoryCallsMade() {
        mqttMeasurementService.handleRawPayload("{not valid json");

        verifyNoInteractions(farmerRepository, collectionCenterRepository, deviceRepository,
                invoiceRepository, alertRepository);
    }

    // Boundary value: farmer_id of 0 fails the "> 0" check and short-circuits processing before any lookup.
    @Test
    void handleRawPayload_zeroFarmerId_skipsProcessing() {
        mqttMeasurementService.handleRawPayload("{\"farmer_id\":0,\"collection_center_id\":1}");

        verifyNoInteractions(farmerRepository, collectionCenterRepository, invoiceRepository, alertRepository);
    }

    // Boundary value: a negative farmer_id also fails validation, one step below the zero boundary.
    @Test
    void handleRawPayload_negativeFarmerId_skipsProcessing() {
        mqttMeasurementService.handleRawPayload("{\"farmer_id\":-5,\"collection_center_id\":1}");

        verifyNoInteractions(farmerRepository, collectionCenterRepository, invoiceRepository, alertRepository);
    }

    // Boundary value: collection_center_id of 0 fails the same "> 0" check for the second id.
    @Test
    void handleRawPayload_zeroCollectionCenterId_skipsProcessing() {
        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":0}");

        verifyNoInteractions(farmerRepository, collectionCenterRepository, invoiceRepository, alertRepository);
    }

    // Error case: ids are well-formed but the farmer does not exist in the DB -> message is skipped, no invoice saved.
    @Test
    void handleRawPayload_unknownFarmer_skipsProcessingWithoutSavingInvoice() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.empty());
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));

        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");

        verify(invoiceRepository, never()).save(any());
        verifyNoInteractions(deviceRepository, alertRepository);
    }

    // Error case: ids are well-formed but the collection center does not exist -> message is skipped, no invoice saved.
    @Test
    void handleRawPayload_unknownCollectionCenter_skipsProcessingWithoutSavingInvoice() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.empty());

        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");

        verify(invoiceRepository, never()).save(any());
        verifyNoInteractions(deviceRepository, alertRepository);
    }

    // Equivalence partitioning: when the center already has a device, the first one is reused and none is created.
    @Test
    void handleRawPayload_existingDeviceForCenter_reusesFirstDeviceWithoutCreating() {
        Device secondDevice = new Device();
        secondDevice.setId(6L);
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Arrays.asList(device, secondDevice));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");

        verify(deviceRepository, never()).save(any(Device.class));
        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        assertEquals(device, captor.getValue().getDevice());
    }

    // Equivalence partitioning: when the center has no device yet, a new one is created and persisted before use.
    @Test
    void handleRawPayload_noExistingDevice_createsAndPersistsNewDevice() {
        Device createdDevice = new Device();
        createdDevice.setId(9L);
        createdDevice.setCollectionCenter(center);
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.emptyList());
        when(deviceRepository.save(any(Device.class))).thenReturn(createdDevice);
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");

        verify(deviceRepository).save(any(Device.class));
        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        assertEquals(createdDevice, captor.getValue().getDevice());
    }

    // Equivalence partitioning: a non-"normal" ph_status triggers creation of a ph_alert Alert record.
    @Test
    void handleRawPayload_abnormalPhStatus_createsPhAlert() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload(
                "{\"farmer_id\":1,\"collection_center_id\":1,\"ph_status\":\"high\"}");

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(captor.capture());
        assertEquals("ph_alert", captor.getValue().getAlertType());
        assertEquals("high", captor.getValue().getSeverity());
    }

    // Boundary value: "NORMAL" in any case must be treated as normal (equalsIgnoreCase) -> no alert created.
    @Test
    void handleRawPayload_normalPhStatusCaseInsensitive_noAlertCreated() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload(
                "{\"farmer_id\":1,\"collection_center_id\":1,\"ph_status\":\"NORMAL\"}");

        verify(alertRepository, never()).save(any(Alert.class));
    }

    // Equivalence partitioning: a non-"normal" tds_status triggers creation of a tds_alert Alert record.
    @Test
    void handleRawPayload_abnormalTdsStatus_createsTdsAlert() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload(
                "{\"farmer_id\":1,\"collection_center_id\":1,\"ph_status\":\"normal\",\"tds_status\":\"high\"}");

        ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(captor.capture());
        assertEquals("tds_alert", captor.getValue().getAlertType());
        assertEquals("high", captor.getValue().getSeverity());
    }

    // Boundary value: optional numeric fields absent from the payload default to BigDecimal.ZERO rather than null.
    @Test
    void handleRawPayload_missingNumericFields_defaultToZero() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        Invoice saved = captor.getValue();
        assertEquals(0, BigDecimal.ZERO.compareTo(saved.getDrc()));
        assertEquals(0, BigDecimal.ZERO.compareTo(saved.getTotalLitres()));
        assertEquals(0, BigDecimal.ZERO.compareTo(saved.getTotalAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(saved.getTemperature()));
    }

    // Boundary value: a missing measurement_datetime falls back to LocalDateTime.now() instead of null or an exception.
    @Test
    void handleRawPayload_missingMeasurementDateTime_fallsBackToNow() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        LocalDateTime before = LocalDateTime.now();
        mqttMeasurementService.handleRawPayload("{\"farmer_id\":1,\"collection_center_id\":1}");
        LocalDateTime after = LocalDateTime.now();

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        LocalDateTime saved = captor.getValue().getMeasurementDateTime();
        assertNotNull(saved);
        assertFalse(saved.isBefore(before));
        assertFalse(saved.isAfter(after));
    }

    // Equivalence partitioning: the alternate camelCase alias field name ("farmerId") resolves to the same id lookup.
    @Test
    void handleRawPayload_alternateFarmerIdAliasField_isResolved() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(collectionCenterRepository.findById(1L)).thenReturn(Optional.of(center));
        when(deviceRepository.findByCollectionCenter(center)).thenReturn(Collections.singletonList(device));
        stubInvoiceSave();

        mqttMeasurementService.handleRawPayload("{\"farmerId\":1,\"collectionCenterId\":1}");

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository).save(captor.capture());
        assertEquals(farmer, captor.getValue().getFarmer());
        assertTrue(true);
    }
}
