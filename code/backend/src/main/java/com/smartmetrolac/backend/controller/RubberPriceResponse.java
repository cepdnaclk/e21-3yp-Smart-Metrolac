package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.RubberPrice;

import java.math.BigDecimal;
import java.time.LocalDate;

public class RubberPriceResponse {

    Long priceId;
    Long companyId;
    String companyName;
    BigDecimal pricePerKg;
    LocalDate effectiveDate;

    public static RubberPriceResponse from(RubberPrice price) {
        RubberPriceResponse response = new RubberPriceResponse();
        response.priceId = price.getPriceId();
        response.companyId = price.getCompany().getId();
        response.companyName = price.getCompany().getName();
        response.pricePerKg = price.getPricePerKg();
        response.effectiveDate = price.getEffectiveDate();
        return response;
    }

    public Long getPriceId() { return priceId; }
    public Long getCompanyId() { return companyId; }
    public String getCompanyName() { return companyName; }
    public BigDecimal getPricePerKg() { return pricePerKg; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
}
