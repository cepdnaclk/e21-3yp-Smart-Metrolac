package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.Alert;
import com.smartmetrolac.backend.entity.UserEntity;
import com.smartmetrolac.backend.repository.AlertRepository;
import com.smartmetrolac.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;

    public AlertService(AlertRepository alertRepository, UserRepository userRepository) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
    }

    public List<Alert> getAlertsByCenter(Long centerId) {
        return alertRepository.findByCollectionCenterId(centerId);
    }

    public List<Alert> getUnresolvedAlertsByCenter(Long centerId) {
        return alertRepository.findUnresolvedByCollectionCenterId(centerId);
    }

    public List<Alert> getAllUnresolvedAlerts() {
        return alertRepository.findAllUnresolved();
    }

    public Alert resolveAlert(Long alertId, Long resolvedByUserId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        UserEntity resolvedBy = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        alert.setResolved(true);
        alert.setResolvedBy(resolvedBy);

        return alertRepository.save(alert);
    }
}
