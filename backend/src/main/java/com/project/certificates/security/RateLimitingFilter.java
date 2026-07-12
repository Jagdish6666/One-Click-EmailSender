package com.project.certificates.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RequestData> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 200;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();
        long currentTime = System.currentTimeMillis();

        requestCounts.compute(clientIp, (key, requestData) -> {
            if (requestData == null || currentTime - requestData.timestamp > TimeUnit.MINUTES.toMillis(1)) {
                return new RequestData(1, currentTime);
            }
            requestData.count++;
            return requestData;
        });

        RequestData data = requestCounts.get(clientIp);

        if (data.count > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static class RequestData {
        int count;
        long timestamp;

        RequestData(int count, long timestamp) {
            this.count = count;
            this.timestamp = timestamp;
        }
    }
}
