package com.HEJZ.HEJZ_back.global.jwt;

import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {
    private final long validityMS;
    private final Key key;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.expires-ms:3600000}") long validityMs) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret)); // 256비트 이상
        this.validityMS = validityMs;
    }

    public String createToken(String username) {
        // JWT 토큰 생성 로직 구현

        Date now = new Date();
        Date validity = new Date(now.getTime() + validityMS);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

    }

    public String getUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token)
                .getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // 토큰이 유효하지 않거나 만료된 경우
            return false;
        }
    }
}
