package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Farmer;

public class FarmerResponse {

    Long id;
    Long userId;
    String farmerCode;
    String name;
    String address;
    String phoneNumber;
    Long collectionCenterId;
    String collectionCenterName;

    public static FarmerResponse from(Farmer farmer, Long userId) {
        FarmerResponse response = new FarmerResponse();
        response.id = farmer.getId();
        response.userId = userId;
        response.farmerCode = String.format("%04d", farmer.getId());
        response.name = farmer.getName();
        response.address = farmer.getAddress();
        response.phoneNumber = farmer.getPhoneNumber();
        response.collectionCenterId = farmer.getCollectionCenter().getId();
        response.collectionCenterName = farmer.getCollectionCenter().getName();
        return response;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFarmerCode() { return farmerCode; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhoneNumber() { return phoneNumber; }
    public Long getCollectionCenterId() { return collectionCenterId; }
    public String getCollectionCenterName() { return collectionCenterName; }
}
