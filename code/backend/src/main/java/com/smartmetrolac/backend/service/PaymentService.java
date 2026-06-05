package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.entity.Payment;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;
import com.smartmetrolac.backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final FarmerRepository farmerRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          FarmerRepository farmerRepository,
                          InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.farmerRepository = farmerRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public Payment calculateAndSaveWeeklyPayment(Long farmerId, int week, int year) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        List<Invoice> invoices = invoiceRepository.findByFarmerAndWeekAndYear(farmer, week, year);

        BigDecimal totalAmount = invoices.stream()
                .map(Invoice::getTotalAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Payment payment = paymentRepository.findByFarmerAndWeekAndYear(farmer, week, year)
                .orElse(new Payment());

        payment.setFarmer(farmer);
        payment.setWeek(week);
        payment.setYear(year);
        payment.setTotalAmount(totalAmount);

        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByFarmer(Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return paymentRepository.findByFarmer(farmer);
    }

    public Payment getPaymentByFarmerAndWeek(Long farmerId, int week, int year) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return paymentRepository.findByFarmerAndWeekAndYear(farmer, week, year)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    public List<Payment> getPaymentsByCenter(Long centerId) {
        return paymentRepository.findByCollectionCenterId(centerId);
    }
}
