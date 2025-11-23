# Multi-stage Dockerfile: build with Maven + JDK 21, run with a smaller JRE image
# Adjust JAVA_OPTS if you need extra JVM memory / flags.

FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only maven files first to leverage caching
COPY pom.xml .
# If you use mvnw, copy it too
COPY mvnw .
COPY .mvn .mvn
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests dependency:go-offline

# Copy the rest of the backend source
COPY src ./src

# Build the application JAR
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests package -DskipTests

# Run stage - use a smaller runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar produced in build stage (find the jar in target/)
# If your artifact name may vary, use wildcard
COPY --from=build /app/target/*.jar app.jar

# Optional: set Java options (tune for the instance size)
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -Dserver.port=$PORT -jar /app/app.jar"]