-- 1. Atualiza a função para ser à prova de falhas (trata NULLs)
CREATE OR REPLACE FUNCTION verificar_e_avancar_lote()
RETURNS TRIGGER AS $$
DECLARE
  novo_lote_numero integer;
  lote_atual_seguro integer;
  vagas_antigas_seguro integer;
BEGIN
  -- Garante que se o valor for nulo, ele considera 1 para o lote e 0 para vagas
  lote_atual_seguro := COALESCE(OLD.lote_atual, 1);
  vagas_antigas_seguro := COALESCE(OLD.vagas_ocupadas, 0);

  -- Verifica se as vagas ocupadas realmente aumentaram
  IF COALESCE(NEW.vagas_ocupadas, 0) > vagas_antigas_seguro THEN
    
    -- Busca o lote correspondente
    SELECT lote_numero
    INTO novo_lote_numero
    FROM pacote_lotes
    WHERE pacote_id = NEW.id
      AND vagas_gatilho > 0 
      AND vagas_gatilho <= NEW.vagas_ocupadas
      AND lote_numero > lote_atual_seguro
    ORDER BY lote_numero DESC
    LIMIT 1;

    -- Atualiza o lote atual se encontrou um válido
    IF novo_lote_numero IS NOT NULL THEN
      NEW.lote_atual := novo_lote_numero;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recria o gatilho de forma mais ampla (escuta qualquer update na linha)
DROP TRIGGER IF EXISTS trigger_avanco_lote ON pacotes;

CREATE TRIGGER trigger_avanco_lote
BEFORE UPDATE ON pacotes
FOR EACH ROW
EXECUTE FUNCTION verificar_e_avancar_lote();