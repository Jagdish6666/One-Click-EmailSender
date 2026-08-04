package com.project.certificates.certificate.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "certificate.send.exchange";
    public static final String QUEUE_NAME = "certificate.send.queue";
    public static final String ROUTING_KEY = "certificate.send.key";

    public static final String DLX_NAME = "certificate.dlx";
    public static final String DLQ_NAME = "certificate.send.dlq";
    public static final String DLQ_ROUTING_KEY = "certificate.send.dlq.key";

    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public DirectExchange dlx() {
        return new DirectExchange(DLX_NAME);
    }

    @Bean
    public Queue dlq() {
        return QueueBuilder.durable(DLQ_NAME).build();
    }

    @Bean
    public Queue queue() {
        return QueueBuilder.durable(QUEUE_NAME)
                .withArgument("x-dead-letter-exchange", DLX_NAME)
                .withArgument("x-dead-letter-routing-key", DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Binding dlqBinding() {
        return BindingBuilder.bind(dlq()).to(dlx()).with(DLQ_ROUTING_KEY);
    }

    @Bean
    public Binding binding() {
        return BindingBuilder.bind(queue()).to(exchange()).with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }
}
