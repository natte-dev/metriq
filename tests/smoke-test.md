# Smoke Test — Metriq

## Objetivo

Verificar que o cálculo de score está correto após o setup.

## Passos

1. Acesse `/listas` — confirme que os departamentos e meses foram criados pelo seed
2. Vá em `/visitas` e crie 4 visitas para **Fiscal** / **2026-02** com status **Concluída**
3. Vá em `/atendimento` e crie 2 atendimentos para **Fiscal** / **2026-02**:
   - Atendimento 1: nota **5**
   - Atendimento 2: nota **4**
4. Vá em `/erros` e crie 1 erro para **Fiscal** / **2026-02**:
   - Tipo: **Leve** (2 pontos)
5. Acesse `/score` e filtre por Fiscal / 2026-02

## Resultado Esperado

| Métrica | Valor Esperado |
|---------|---------------|
| Concluídas | 4 |
| Meta | 4 |
| Visitação % | 100.00% |
| Total Atend. | 2 |
| Média Nota | 4.50 |
| Atendimento % | 90.00% |
| Penalidades | 2 |
| Qualidade % | 98.00% |
| **Score Final** | **96.00** |

## Cálculo

```
visitacao_pct   = (4 / 4) × 100 = 100.00
atendimento_pct = (4.5 / 5) × 100 = 90.00
qualidade_pct   = MAX(0, 100 - 2) = 98.00

score_final = ROUND(
  100.00 × 0.40 +
  90.00  × 0.35 +
  98.00  × 0.25,
  2
)
= ROUND(40.00 + 31.50 + 24.50, 2)
= ROUND(96.00, 2)
= 96.00 ✓
```
