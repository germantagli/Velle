# Velle - Plataforma Financiera Venezuela

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PRESENTACIÓN                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   React Native App  │  │   Admin Dashboard   │  │  Merchant POS (future)  │  │
│  │   (Android + iOS)   │  │   (Web Internal)    │  │                         │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────────┬────────────┘  │
└─────────────┼────────────────────────┼────────────────────────────┼──────────────┘
              │                        │                            │
              └────────────────────────┼────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────────┐
│                           API GATEWAY / BFF                                       │
│  ┌──────────────────────────────────┴──────────────────────────────────────┐   │
│  │  • Auth (JWT + MFA)  • Rate Limiting  • Request Validation  • Logging    │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────────┐
│                           CAPA DE SERVICIOS                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   Auth       │ │   Wallet     │ │  Zelle       │ │  KYC/AML     │           │
│  │   Service    │ │   Service    │ │  Service     │ │  Service     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   P2P        │ │  Merchant    │ │  Virtual     │ │  AI Support  │           │
│  │   Transfer   │ │  Payment     │ │  Card        │ │  & Fraud     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
└─────────────────────────────────────┼───────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼───────────────────────────────────────────┐
│                           CAPA DE DATOS / INTEGRACIONES                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  PostgreSQL  │ │  Redis       │ │  USDT        │ │  Zelle       │           │
│  │  (Primary)   │ │  (Cache)     │ │  Provider    │ │  Partner     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                            │
│  │  KYC         │ │  Card        │ │  VES→USDT    │                            │
│  │  Provider    │ │  Issuer      │ │  Provider    │                            │
│  └──────────────┘ └──────────────┘ └──────────────┘                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. App Móvil (React Native)
- **Stack:** React Native + TypeScript + React Navigation
- **Estado:** Redux Toolkit / Zustand
- **Seguridad:** Keychain/Keystore para tokens, certificate pinning
- **Flujos:** Login MFA, KYC, Wallet, Zelle, P2P, Merchant QR, Virtual Card

### 2. Backend API
- **Stack:** Node.js + TypeScript + NestJS (o Express)
- **Base de datos:** PostgreSQL con Prisma ORM
- **Cola:** Redis/Bull para jobs asíncronos
- **Hosting:** AWS ECS/Fargate o GCP Cloud Run

### 3. Integraciones Externas (Partners Regulados)
- **USDT:** Tether, custodia externa regulada o wallet institucional
- **Zelle:** Cuenta corporativa con banco US o fintech con licencia
- **VES→USDT:** Proveedor P2P autorizado o exchange regulado
- **Tarjetas virtuales:** Marqeta, Galileo, o similar con licencia

### 4. Seguridad
- Encriptación TLS 1.3 en tránsito
- AES-256 para datos sensibles en reposo
- HSM o KMS para claves de wallet
- Auditoría completa de transacciones

## Cumplimiento Regulatorio

- **FinCEN (EE.UU.):** Registro MSB si se opera desde US
- **KYC/AML:** Verificación de identidad, listas OFAC/PEP
- **Venezuela:** Buenas prácticas, separación de fondos
- **PCI-DSS:** Para manejo de datos de tarjetas
