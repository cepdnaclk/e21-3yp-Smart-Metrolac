package com.smartmetrolac.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/hello")
    public String hello() {
        return "Spring Boot backend working";
    }

    @GetMapping("/api/test")
    public Map<String, Object> test() {
        return Map.of(
                "project", "Smart Metrolac",
                "status", "Backend running"
        );
    }
}