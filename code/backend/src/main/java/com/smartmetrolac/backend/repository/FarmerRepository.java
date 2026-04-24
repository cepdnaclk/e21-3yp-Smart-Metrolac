package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {

    List<Farmer> findByCollectionCenter(CollectionCenter collectionCenter);
}
