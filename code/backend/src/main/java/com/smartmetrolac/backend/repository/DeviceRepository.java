package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByCollectionCenter(CollectionCenter collectionCenter);
}
