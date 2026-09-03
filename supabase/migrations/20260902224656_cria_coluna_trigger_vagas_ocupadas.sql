
-- Atualizar Tabela de Pacotes
ALTER TABLE pacotes ADD COLUMN vagas_ocupadas INTEGER NOT NULL DEFAULT 0;

-- Criar Função do Gatilho
CREATE OR REPLACE FUNCTION atualiza_vagas_ocupadas()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for uma nova reserva confirmada
  IF (TG_OP = 'INSERT' AND NEW.status = 'Confirmada') THEN
    UPDATE pacotes SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = NEW.pacote_id;
  
  -- Se a reserva for atualizada (mudou de/para Confirmada)
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != 'Confirmada' AND NEW.status = 'Confirmada') THEN
      UPDATE pacotes SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = NEW.pacote_id;
    ELSIF (OLD.status = 'Confirmada' AND NEW.status != 'Confirmada') THEN
      UPDATE pacotes SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = NEW.pacote_id;
    END IF;

  -- Se uma reserva confirmada for deletada
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'Confirmada') THEN
    UPDATE pacotes SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = OLD.pacote_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ativar o Gatilho
CREATE TRIGGER tr_atualiza_vagas
AFTER INSERT OR UPDATE OR DELETE ON reservas
FOR EACH ROW EXECUTE FUNCTION atualiza_vagas_ocupadas();