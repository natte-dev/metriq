-- CreateView: v_score_mensal
-- Calcula o score mensal por departamento e mês
-- Fórmulas fiéis à planilha Excel original

CREATE OR REPLACE VIEW v_score_mensal AS
SELECT
  d.id                                                   AS department_id,
  d.name                                                 AS department_name,
  m_data.month                                           AS month,

  -- Visitação: quantidade de visitas Concluídas
  COALESCE(SUM(CASE WHEN sv.name = 'Concluída' THEN 1 ELSE 0 END), 0)  AS concluidas,
  p.meta_visitas_mes                                     AS meta_visitas_mes,
  CASE
    WHEN p.meta_visitas_mes = 0 THEN 0
    ELSE ROUND(
      COALESCE(SUM(CASE WHEN sv.name = 'Concluída' THEN 1 ELSE 0 END), 0)
      / p.meta_visitas_mes * 100, 4)
  END                                                    AS visitacao_pct,

  -- Atendimento: média das notas
  COUNT(DISTINCT a.id)                                   AS total_atendimentos,
  COALESCE(AVG(n.value), 0)                              AS media_nota,
  p.escala_atendimento_max                               AS escala_atendimento_max,
  CASE
    WHEN COUNT(DISTINCT a.id) = 0 THEN 0
    ELSE ROUND(AVG(n.value) / p.escala_atendimento_max * 100, 4)
  END                                                    AS atendimento_pct,

  -- Qualidade: 100 - soma das penalidades
  COALESCE(SUM(
    CASE
      WHEN e.penalty_points_override IS NOT NULL THEN e.penalty_points_override
      ELSE te.penalty_points
    END
  ), 0)                                                  AS soma_penalidades,
  GREATEST(0,
    100 - COALESCE(SUM(
      CASE
        WHEN e.penalty_points_override IS NOT NULL THEN e.penalty_points_override
        ELSE te.penalty_points
      END
    ), 0)
  )                                                      AS qualidade_pct,

  -- Score Final
  ROUND(
    (CASE
      WHEN p.meta_visitas_mes = 0 THEN 0
      ELSE COALESCE(SUM(CASE WHEN sv.name = 'Concluída' THEN 1 ELSE 0 END), 0)
           / p.meta_visitas_mes * 100
    END) * p.peso_visitacao
    +
    (CASE
      WHEN COUNT(DISTINCT a.id) = 0 THEN 0
      ELSE AVG(n.value) / p.escala_atendimento_max * 100
    END) * p.peso_atendimento
    +
    GREATEST(0,
      100 - COALESCE(SUM(
        CASE
          WHEN e.penalty_points_override IS NOT NULL THEN e.penalty_points_override
          ELSE te.penalty_points
        END
      ), 0)
    ) * p.peso_qualidade,
  2)                                                     AS score_final

FROM
  departments d
  -- Eixo de meses: union de todos os meses com dados
  CROSS JOIN (
    SELECT month FROM visitas
    UNION
    SELECT month FROM atendimentos
    UNION
    SELECT month FROM erros
  ) m_data
  -- Parâmetros globais (sempre 1 linha)
  CROSS JOIN app_params p

  -- Visitas do mês e departamento
  LEFT JOIN visitas v
    ON v.department_id = d.id AND v.month = m_data.month
  LEFT JOIN status_visita sv
    ON sv.id = v.status_id

  -- Atendimentos do mês e departamento
  LEFT JOIN atendimentos a
    ON a.department_id = d.id AND a.month = m_data.month
  LEFT JOIN notas n
    ON n.id = a.nota_id

  -- Erros do mês e departamento
  LEFT JOIN erros e
    ON e.department_id = d.id AND e.month = m_data.month
  LEFT JOIN tipo_erro te
    ON te.id = e.tipo_erro_id

GROUP BY
  d.id,
  d.name,
  m_data.month,
  p.meta_visitas_mes,
  p.escala_atendimento_max,
  p.peso_visitacao,
  p.peso_atendimento,
  p.peso_qualidade;
