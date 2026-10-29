# ==========================================
# STAGE 1: Build Application with Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies first (Docker layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-privileged system user and upload directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -h /home/appuser \
    && mkdir -p /home/appuser/uploads \
    && chown -R appuser:appgroup /home/appuser /app

# Copy built Spring Boot jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/app.jar app.jar

USER appuser

# Expose HTTP port (Render uses dynamic $PORT, defaults to 8080)
EXPOSE 8080

# JVM memory constraints strictly tuned for Render Free Tier (512MB RAM cap):
# - Heap max 256MB, Metaspace 112MB, Serial GC (reduces GC thread memory overhead)
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:MaxMetaspaceSize=112m", "-XX:+UseSerialGC", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

