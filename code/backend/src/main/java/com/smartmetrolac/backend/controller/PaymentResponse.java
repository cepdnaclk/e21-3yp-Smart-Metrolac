package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Payment;

import java.math.BigDecimal;

public class PaymentResponse {

    Long id;
    Long farmerId;
    String farmerName;
    int week;
    int year;
    BigDecimal totalAmount;

    public static PaymentResponse from(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.id = payment.getPaymentId();
        response.farmerId = payment.getFarmer().getId();
        response.farmerName = payment.getFarmer().getName();
        response.week = payment.getWeek();
        response.year = payment.getYear();
        response.totalAmount = payment.getTotalAmount();
        return response;
    }

    public Long getId() { return id; }
    public Long getFarmerId() { return farmerId; }
    public String getFarmerName() { return farmerName; }
    public int getWeek() { return week; }
    public int getYear() { return year; }
    public BigDecimal getTotalAmount() { return totalAmount; }
}
