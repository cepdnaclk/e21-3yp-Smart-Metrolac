package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Device;
import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.DeviceRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final FarmerRepository farmerRepository;
    private final DeviceRepository deviceRepository;
    private final CollectionCenterRepository collectionCenterRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          FarmerRepository farmerRepository,
                          DeviceRepository deviceRepository,
                          CollectionCenterRepository collectionCenterRepository) {
        this.invoiceRepository = invoiceRepository;
        this.farmerRepository = farmerRepository;
        this.deviceRepository = deviceRepository;
        this.collectionCenterRepository = collectionCenterRepository;
    }

    public List<Invoice> getInvoicesByCenter(Long centerId) {
        CollectionCenter collectionCenter = collectionCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));
        return invoiceRepository.findByCollectionCenter(collectionCenter);
    }

    public List<Invoice> getInvoicesByCenterAndDateRange(Long centerId,
                                                         LocalDateTime start,
                                                         LocalDateTime end) {
        CollectionCenter collectionCenter = collectionCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));
        return invoiceRepository.findByCollectionCenterAndMeasurementDateTimeBetween(
                collectionCenter, start, end);
    }

    public List<Invoice> getInvoicesByCenterAndWeek(Long centerId, int week, int year) {
        CollectionCenter collectionCenter = collectionCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));
        return invoiceRepository.findByCollectionCenterAndWeekAndYear(collectionCenter, week, year);
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public Invoice createInvoice(Long farmerId,
                                 Long deviceId,
                                 Long centerId,
                                 LocalDateTime measurementDateTime,
                                 BigDecimal drc,
                                 BigDecimal totalLitres,
                                 BigDecimal totalAmount,
                                 BigDecimal temperature,
                                 String phStatus,
                                 String tdsStatus) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        CollectionCenter collectionCenter = collectionCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));

        Invoice invoice = new Invoice();
        invoice.setFarmer(farmer);
        invoice.setDevice(device);
        invoice.setCollectionCenter(collectionCenter);
        invoice.setMeasurementDateTime(measurementDateTime);
        invoice.setDrc(drc);
        invoice.setTotalLitres(totalLitres);
        invoice.setTotalAmount(totalAmount);
        invoice.setTemperature(temperature);
        invoice.setPhStatus(phStatus);
        invoice.setTdsStatus(tdsStatus);

        return invoiceRepository.save(invoice);
    }
}
