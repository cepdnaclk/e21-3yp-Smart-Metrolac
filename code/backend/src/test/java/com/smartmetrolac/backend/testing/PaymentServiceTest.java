package com.smartmetrolac.backend.testing;

import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.entity.Payment;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;
import com.smartmetrolac.backend.repository.PaymentRepository;
import com.smartmetrolac.backend.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Farmer farmer;

    @BeforeEach
    void setUp() {
        farmer = new Farmer();
        farmer.setId(1L);
    }

    private Invoice invoiceWithAmount(BigDecimal amount) {
        Invoice invoice = new Invoice();
        invoice.setTotalAmount(amount);
        return invoice;
    }

    // Error case: unknown farmer id -> service throws before touching invoices/payments.
    @Test
    void calculateAndSaveWeeklyPayment_farmerNotFound_throwsException() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026));
        assertEquals("Farmer not found", ex.getMessage());
        verify(paymentRepository, never()).save(any());
    }

    // Boundary value: no invoices for the week -> total amount collapses to the stream's identity value, BigDecimal.ZERO.
    @Test
    void calculateAndSaveWeeklyPayment_noInvoices_totalIsZero() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026);

        assertEquals(0, BigDecimal.ZERO.compareTo(result.getTotalAmount()));
    }

    // Equivalence partitioning: multiple invoices in the period are summed into a single payment total.
    @Test
    void calculateAndSaveWeeklyPayment_sumsMultipleInvoiceAmounts() {
        List<Invoice> invoices = Arrays.asList(
                invoiceWithAmount(new BigDecimal("1000.00")),
                invoiceWithAmount(new BigDecimal("2500.50")));
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(invoices);
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026);

        assertEquals(0, new BigDecimal("3500.50").compareTo(result.getTotalAmount()));
    }

    // Boundary value: an invoice with a null totalAmount must be filtered out rather than causing a NullPointerException.
    @Test
    void calculateAndSaveWeeklyPayment_nullInvoiceAmounts_areExcludedFromSum() {
        List<Invoice> invoices = Arrays.asList(
                invoiceWithAmount(new BigDecimal("500.00")),
                invoiceWithAmount(null));
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(invoices);
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026);

        assertEquals(0, new BigDecimal("500.00").compareTo(result.getTotalAmount()));
    }

    // Equivalence partitioning: a payment record already exists for this farmer/week/year -> it is updated in place, not duplicated.
    @Test
    void calculateAndSaveWeeklyPayment_existingPayment_updatesSameRecord() {
        Payment existing = new Payment();
        existing.setPaymentId(99L);
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026))
                .thenReturn(Collections.singletonList(invoiceWithAmount(new BigDecimal("100.00"))));
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026);

        assertEquals(99L, result.getPaymentId());
        assertEquals(0, new BigDecimal("100.00").compareTo(result.getTotalAmount()));
    }

    // Equivalence partitioning: no prior payment for this farmer/week/year -> a brand-new Payment entity is created.
    @Test
    void calculateAndSaveWeeklyPayment_noExistingPayment_createsNewPayment() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 10, 2026)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.calculateAndSaveWeeklyPayment(1L, 10, 2026);

        assertNull(result.getPaymentId());
        assertEquals(farmer, result.getFarmer());
    }

    // Boundary value: week 53 is a valid ISO week-number boundary and must be persisted verbatim, not clamped.
    @Test
    void calculateAndSaveWeeklyPayment_boundaryWeek53_isPersistedAsGiven() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(invoiceRepository.findByFarmerAndWeekAndYear(farmer, 53, 2026)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByFarmerAndWeekAndYear(farmer, 53, 2026)).thenReturn(Optional.empty());
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        when(paymentRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        paymentService.calculateAndSaveWeeklyPayment(1L, 53, 2026);

        assertEquals(53, captor.getValue().getWeek());
        assertEquals(2026, captor.getValue().getYear());
    }
}
