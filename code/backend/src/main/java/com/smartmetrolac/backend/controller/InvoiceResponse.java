package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceResponse {

    Long id;
    Long farmerId;
    String farmerName;
    Long deviceId;
    Long collectionCenterId;
    String collectionCenterName;
    LocalDateTime measurementDateTime;
    BigDecimal drc;
    BigDecimal totalLitres;
    BigDecimal totalAmount;
    BigDecimal temperature;
    String phStatus;
    String tdsStatus;

    public static InvoiceResponse from(Invoice invoice) {
        InvoiceResponse response = new InvoiceResponse();
        response.id = invoice.getId();
        response.farmerId = invoice.getFarmer().getId();
        response.farmerName = invoice.getFarmer().getName();
        response.deviceId = invoice.getDevice().getId();
        response.collectionCenterId = invoice.getCollectionCenter().getId();
        response.collectionCenterName = invoice.getCollectionCenter().getName();
        response.measurementDateTime = invoice.getMeasurementDateTime();
        response.drc = invoice.getDrc();
        response.totalLitres = invoice.getTotalLitres();
        response.totalAmount = invoice.getTotalAmount();
        response.temperature = invoice.getTemperature();
        response.phStatus = invoice.getPhStatus();
        response.tdsStatus = invoice.getTdsStatus();
        return response;
    }

    public Long getId() { return id; }
    public Long getFarmerId() { return farmerId; }
    public String getFarmerName() { return farmerName; }
    public Long getDeviceId() { return deviceId; }
    public Long getCollectionCenterId() { return collectionCenterId; }
    public String getCollectionCenterName() { return collectionCenterName; }
    public LocalDateTime getMeasurementDateTime() { return measurementDateTime; }
    public BigDecimal getDrc() { return drc; }
    public BigDecimal getTotalLitres() { return totalLitres; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getTemperature() { return temperature; }
    public String getPhStatus() { return phStatus; }
    public String getTdsStatus() { return tdsStatus; }
}
