package com.smartmetrolac.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "device")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "device_id")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "collection_center_id")
    private CollectionCenter collectionCenter;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CollectionCenter getCollectionCenter() {
        return collectionCenter;
    }

    public void setCollectionCenter(CollectionCenter collectionCenter) {
        this.collectionCenter = collectionCenter;
    }
}
