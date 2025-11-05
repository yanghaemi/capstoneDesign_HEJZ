# 빌드 환경 (Gradle 포함) 설정
FROM gradle:8.5-jdk17 AS build

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 캐싱을 위한 Gradle 파일 먼저 복사
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

# Gradle 실행 권한 부여
RUN chmod +x gradlew

# 의존성 미리 다운 (캐시 최적화)
RUN ./gradlew dependencies --no-daemon || return 0

# 프로젝트의 모든 파일을 컨테이너 내부로 복사
COPY . .

RUN chmod +x gradlew

# 테스트는 제외하고 빌드
RUN ./gradlew build -x test --no-daemon

# 실행 환경 (경량 JDK) 설정
# FROM openjdk:17-jdk-slim
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# 빌드된 JAR 복사 (JAR 이름 명시)
COPY --from=build /app/build/libs/*.jar app.jar

# Spring Boot 실행
CMD ["java", "-jar", "app.jar"]
