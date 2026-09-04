CREATE OR REPLACE FUNCTION verificar_e_avancar_lote()
RETURNS TRIGGER AS $$
DECLARE
  novo_lote_numero integer;
BEGIN
  -- Verifica se as vagas ocupadas aumentaram
  IF NEW.vagas_ocupadas > OLD.vagas_ocupadas THEN
    
    SELECT lote_numero
    INTO novo_lote_numero
    FROM pacote_lotes
    WHERE pacote_id = NEW.id
      AND vagas_gatilho > 0 
      AND vagas_gatilho <= NEW.vagas_ocupadas
      AND lote_numero > OLD.lote_atual
    ORDER BY lote_numero DESC
    LIMIT 1;

    IF novo_lote_numero IS NOT NULL THEN
      NEW.lote_atual := novo_lote_numero;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;