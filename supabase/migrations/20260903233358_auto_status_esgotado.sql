-- 1. Função que verifica as vagas e ajusta o status do pacote
CREATE OR REPLACE FUNCTION verifica_status_pacote()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o número de vagas ocupadas atingir ou passar o total de vagas e estiver Ativo
  IF NEW.vagas > 0 AND NEW.vagas_ocupadas >= NEW.vagas AND NEW.status = 'Ativo' THEN
    NEW.status := 'Esgotado';
  
  -- Se houver vagas liberadas (ex: cancelamento) e o pacote estava Esgotado
  ELSIF NEW.vagas_ocupadas < NEW.vagas AND NEW.status = 'Esgotado' THEN
    NEW.status := 'Ativo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Gatilho disparado antes de inserir ou atualizar pacotes
CREATE TRIGGER tr_verifica_status_pacote
BEFORE INSERT OR UPDATE OF vagas, vagas_ocupadas ON pacotes
FOR EACH ROW EXECUTE FUNCTION verifica_status_pacote();