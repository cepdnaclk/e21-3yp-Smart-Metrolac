package com.smartmetrolac.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "farmer_id")
    private Farmer farmer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "device_id")
    private Device device;

    @ManyToOne(optional = false)
    @JoinColumn(name = "collection_center_id")
    private CollectionCenter collectionCenter;

    @Column(name = "measurement_datetime", nullable = false)
    private LocalDateTime measurementDateTime;

    @Column(name = "drc", nullable = false, precision = 5, scale = 2)
    private BigDecimal drc;

    @Column(name = "total_litres", nullable = false, precision = 8, scale = 2)
    private BigDecimal totalLitres;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "temperature", precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(name = "ph_status", length = 20)
    private String phStatus;

    @Column(name = "tds_status", length = 20)
    private String tdsStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Farmer getFarmer() {
        return farmer;
    }

    public void setFarmer(Farmer farmer) {
        this.farmer = farmer;
    }

    public Device getDevice() {
        return device;
    }

    public void setDevice(Device device) {
        this.device = device;
    }

    public CollectionCenter getCollectionCenter() {
        return collectionCenter;
    }

    public void setCollectionCenter(CollectionCenter collectionCenter) {
        this.collectionCenter = collectionCenter;
    }

    public LocalDateTime getMeasurementDateTime() {
        return measurementDateTime;
    }

    public void setMeasurementDateTime(LocalDateTime measurementDateTime) {
        this.measurementDateTime = measurementDateTime;
    }

    public BigDecimal getDrc() {
        return drc;
    }

    public void setDrc(BigDecimal drc) {
        this.drc = drc;
    }

    public BigDecimal getTotalLitres() {
        return totalLitres;
    }

    public void setTotalLitres(BigDecimal totalLitres) {
        this.totalLitres = totalLitres;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public void setTemperature(BigDecimal temperature) {
        this.temperature = temperature;
    }

    public String getPhStatus() {
        return phStatus;
    }

    public void setPhStatus(String phStatus) {
        this.phStatus = phStatus;
    }

    public String getTdsStatus() {
        return tdsStatus;
    }

    public void setTdsStatus(String tdsStatus) {
        this.tdsStatus = tdsStatus;
    }
}
