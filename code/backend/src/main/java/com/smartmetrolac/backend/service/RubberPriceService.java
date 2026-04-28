package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.Company;
import com.smartmetrolac.backend.entity.RubberPrice;
import com.smartmetrolac.backend.repository.CompanyRepository;
import com.smartmetrolac.backend.repository.RubberPriceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RubberPriceService {

    private final RubberPriceRepository rubberPriceRepository;
    private final CompanyRepository companyRepository;

    public RubberPriceService(RubberPriceRepository rubberPriceRepository,
                               CompanyRepository companyRepository) {
        this.rubberPriceRepository = rubberPriceRepository;
        this.companyRepository = companyRepository;
    }

    public RubberPrice getCurrentPrice(Long companyId) {
        List<RubberPrice> prices = rubberPriceRepository.findLatestByCompanyId(companyId);
        if (prices.isEmpty()) {
            throw new RuntimeException("No price set for this company");
        }
        return prices.get(0);
    }

    public RubberPrice setPrice(Long companyId, BigDecimal pricePerKg) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        RubberPrice price = rubberPriceRepository
                .findByCompanyIdAndEffectiveDate(companyId, LocalDate.now())
                .orElseGet(() -> {
                    RubberPrice newPrice = new RubberPrice();
                    newPrice.setCompany(company);
                    newPrice.setEffectiveDate(LocalDate.now());
                    return newPrice;
                });

        price.setPricePerKg(pricePerKg);
        return rubberPriceRepository.save(price);
    }
}
