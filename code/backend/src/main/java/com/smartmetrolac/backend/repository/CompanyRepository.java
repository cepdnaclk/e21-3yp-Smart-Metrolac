package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}
