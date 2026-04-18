package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Farmer;

public class FarmerResponse {

    Long id;
    String name;
    String address;
    String phoneNumber;
    Long collectionCenterId;
    String collectionCenterName;

    public static FarmerResponse from(Farmer farmer) {
        FarmerResponse response = new FarmerResponse();
        response.id = farmer.getId();
        response.name = farmer.getName();
        response.address = farmer.getAddress();
        response.phoneNumber = farmer.getPhoneNumber();
        response.collectionCenterId = farmer.getCollectionCenter().getId();
        response.collectionCenterName = farmer.getCollectionCenter().getName();
        return response;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhoneNumber() { return phoneNumber; }
    public Long getCollectionCenterId() { return collectionCenterId; }
    public String getCollectionCenterName() { return collectionCenterName; }
}
