package com.smartmetrolac.backend;

import com.smartmetrolac.backend.mqtt.MqttMeasurementService;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

@Configuration
@EnableIntegration
public class MqttConfig {

    private static final Logger log = LoggerFactory.getLogger(MqttConfig.class);

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Value("${mqtt.client.id}")
    private String clientId;

    @Value("${mqtt.topic}")
    private String topic;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();

        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{brokerUrl});
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer inbound() {
        String[] topics = topic.split(",");
        for (int i = 0; i < topics.length; i++) {
            topics[i] = topics[i].trim();
        }

        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(
                        clientId,
                        mqttClientFactory(),
                        topics
                );

        adapter.setCompletionTimeout(5000);
        adapter.setQos(0);
        adapter.setOutputChannel(mqttInputChannel());

        log.info("MQTT subscriber ready: broker={}, clientId={}, topics={}", brokerUrl, clientId, String.join(",", topics));

        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler handler(MqttMeasurementService mqttMeasurementService) {
        return message -> {
            Object payload = message.getPayload();
            if (payload != null) {
                Object receivedTopic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
                log.debug("MQTT message received on topic={}", receivedTopic);
                log.info("MQTT payload received on topic={}: {}", receivedTopic, payload);
                mqttMeasurementService.handleRawPayload(payload.toString());
            } else {
                log.warn("MQTT message received with null payload");
            }
        };
    }
}