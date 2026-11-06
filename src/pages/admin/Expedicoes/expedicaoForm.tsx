import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import type { Expedicao, PaletaTema, ConteudoExperiencia, BlocoZigueZague } from '@/types';
import '../admin-theme.css';

import imageCompression from 'browser-image-compression';

type Tab = 'geral' | 'visual' | 'conteudo_extra' | 'fotos' | 'inclusoes' | 'roteiro';

export type ZigueZagueDraftItem = BlocoZigueZague & {
  pendingFile?: File | null;
};

export type ConteudoExperienciaState = Required<ConteudoExperiencia>;

type FormState = {
  nome: string;
  pais: string;
  tipo_destino: string;
  descricao: string;
  categorias: string[];
  fotos: string[];
  incluso: string[];
  nao_incluso: string[];
  observacoes: string[];
  // Identidade Visual
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  cor_texto: string;
  // Novos conteúdos da Landing Page
  frase_destaque: string;
  motivo_epoca_titulo: string;
  motivo_epoca_texto: string;
  blocos_ziguezague: ZigueZagueDraftItem[];
  conteudo_experiencia: ConteudoExperienciaState;
};

type RoteiroDraftItem = {
  localId: string;
  id?: string;
  dia: number;
  titulo: string;
  descricao: string;
  imagens?: string[];
  pendingImageFile?: File | null;
};

const DEFAULT_CONTEUDO_EXPERIENCIA: ConteudoExperienciaState = {
  pilares_titulo: 'Uma viagem para viver, não para administrar',
  pilares: [
    {
      titulo: 'CURADORIA',
      descricao:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Roteiros testados presencialmente e escolhas pensadas nos mínimos detalhes.',
    },
    {
      titulo: 'PRESENÇA',
      descricao:
        'Lorem ipsum dolor sit amet. Acompanhamento integral de host brasileira durante toda a expedição para você viajar com total tranquilidade.',
    },
    {
      titulo: 'LIBERDADE',
      descricao:
        'Lorem ipsum dolor sit amet. Equilíbrio ideal entre programação em grupo e tempo livre garantido no roteiro para curtir no seu ritmo.',
    },
  ],
  jornada_titulo: 'Tudo pensado para você aproveitar a viagem',
  jornada: [
    {
      etapa: 'Antes do embarque',
      descricao:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Orientação completa sobre preparação, documentação e encontro pré-viagem.',
    },
    {
      etapa: 'Durante a viagem',
      descricao:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Logística fluida, suporte diário presencial e experiências autênticas.',
    },
    {
      etapa: 'Uma viagem que continua depois',
      descricao:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Memórias compartilhadas e conexões reais que permanecem após o retorno.',
    },
  ],
  perfil_titulo: 'Essa viagem é pra mim?',
  perfis: [
    {
      titulo: 'Para quem viaja sozinho(a)',
      descricao:
        'Lorem ipsum dolor sit amet. Você embarca sozinho, mas encontra um grupo acolhedor e alinhado com a mesma vontade de explorar.',
    },
    {
      titulo: 'Para grupos de amigos',
      descricao:
        'Lorem ipsum dolor sit amet. A alegria de viajar entre amigos sem o desgaste de alguém precisar organizar ou cobrar a logística.',
    },
    {
      titulo: 'Para casais',
      descricao:
        'Lorem ipsum dolor sit amet. Momentos a dois com total segurança, conforto e a liberdade de aproveitar cada cenário sem preocupações.',
    },
  ],
  perfil_fechamento:
    'No fim, o mais importante não é a companhia com que você embarca, mas o desejo de viver essa experiência intensamente.',
};

const EMPTY_FORM: FormState = {
  nome: '',
  pais: '',
  tipo_destino: '',
  descricao: '',
  categorias: [],
  fotos: [],
  incluso: [],
  nao_incluso: [],
  observacoes: [],
  cor_primaria: '#2f4842',
  cor_secundaria: '#fdb17f',
  cor_fundo: '#fffaf8',
  cor_texto: '#26332f',
  frase_destaque: '',
  motivo_epoca_titulo: '',
  motivo_epoca_texto: '',
  blocos_ziguezague: [],
  conteudo_experiencia: DEFAULT_CONTEUDO_EXPERIENCIA,
};

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatarEstiloWhatsApp(texto: string) {
  if (!texto) return { __html: '' };
  
  const htmlFormatado = texto
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<i>$1</i>')
    .replace(/~([^~]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br />');

  return { __html: htmlFormatado };
}

export function ExpedicaoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [expedicaoId, setExpedicaoId] = useState<string | null>(isNew ? null : id!);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<Tab>('geral');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; pais?: boolean; tipo_destino?: boolean }>({});
  
  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [deletedFotos, setDeletedFotos] = useState<string[]>([]);

  const [paletasSalvas, setPaletasSalvas] = useState<PaletaTema[]>([]);
  const [selectedPaletaId, setSelectedPaletaId] = useState<string>('');
  const [paletteModalOpen, setPaletteModalOpen] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [savingPalette, setSavingPalette] = useState(false);
  const [paletteModalError, setPaletteModalError] = useState('');

  const [roteiroItems, setRoteiroItems] = useState<RoteiroDraftItem[]>([]);
  const [deletedRoteiroIds, setDeletedRoteiroIds] = useState<string[]>([]);

  const AVAILABLE_TABS: Tab[] = isNew
    ? ['geral', 'visual', 'conteudo_extra', 'fotos', 'inclusoes']
    : ['geral', 'visual', 'conteudo_extra', 'fotos', 'inclusoes', 'roteiro'];

  useEffect(() => {
    fetchPaletas();
    if (!isNew && id) fetchExpedicao(id);
  }, [id]);

  async function fetchPaletas() {
    const { data } = await supabase.from('paletas_temas').select('*').order('nome');
    if (data) setPaletasSalvas(data as PaletaTema[]);
  }

  function openPaletteModal() {
    setNewPaletteName('');
    setPaletteModalError('');
    setPaletteModalOpen(true);
  }

  function closePaletteModal() {
    if (savingPalette) return;
    setPaletteModalOpen(false);
    setPaletteModalError('');
  }

  async function handleSaveNewPalette(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault();
    setPaletteModalError('');

    const nomeLimpo = newPaletteName.trim();
    if (!nomeLimpo) {
      setPaletteModalError('Informe um nome para identificar a paleta.');
      return;
    }

    setSavingPalette(true);
    const payload = {
      nome: nomeLimpo,
      cor_primaria: form.cor_primaria,
      cor_secundaria: form.cor_secundaria,
      cor_fundo: form.cor_fundo,
      cor_texto: form.cor_texto,
    };

    const { data, error: insertErr } = await supabase
      .from('paletas_temas')
      .insert([payload])
      .select()
      .single();

    setSavingPalette(false);

    if (insertErr || !data) {
      if (insertErr?.code === '23505') {
        setPaletteModalError('Já existe uma paleta cadastrada com este nome.');
      } else {
        setPaletteModalError('Não foi possível salvar a paleta. Tente novamente.');
      }
      return;
    }

    const novaPaleta = data as PaletaTema;
    const listaAtualizada = [...paletasSalvas, novaPaleta].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );
    setPaletasSalvas(listaAtualizada);
    setSelectedPaletaId(novaPaleta.id);
    setPaletteModalOpen(false);
    setSuccess(`Paleta "${novaPaleta.nome}" salva com sucesso!`);
  }

  async function fetchExpedicao(expId: string) {
    setLoading(true);
    setError('');

    const [expResult, roteiroResult] = await Promise.all([
      supabase.from('expedicoes').select('*').eq('id', expId).single(),
      supabase
        .from('roteiros')
        .select('*')
        .eq('expedicao_id', expId)
        .order('dia', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (expResult.error || !expResult.data) {
      setError('Não foi possível carregar essa expedição.');
      setLoading(false);
      return;
    }

    const exp = expResult.data as Expedicao & Record<string, any>;
    const rawExpContent = exp.conteudo_experiencia || {};

    setForm({
      nome: exp.nome || '',
      pais: exp.pais || '',
      tipo_destino: exp.tipo_destino || '',
      descricao: exp.descricao || '',
      categorias: exp.categorias ?? [],
      fotos: exp.fotos ?? [],
      incluso: exp.incluso ?? [],
      nao_incluso: exp.nao_incluso ?? [],
      observacoes: exp.observacoes ?? [],
      cor_primaria: exp.cor_primaria || '#2f4842',
      cor_secundaria: exp.cor_secundaria || '#fdb17f',
      cor_fundo: exp.cor_fundo || '#fffaf8',
      cor_texto: exp.cor_texto || '#26332f',
      frase_destaque: exp.frase_destaque || '',
      motivo_epoca_titulo: exp.motivo_epoca_titulo || '',
      motivo_epoca_texto: exp.motivo_epoca_texto || '',
      blocos_ziguezague: Array.isArray(exp.blocos_ziguezague)
        ? exp.blocos_ziguezague.map((b: any) => ({
            id: b.id || uid(),
            titulo: b.titulo || '',
            texto: b.texto || '',
            imagem: b.imagem || '',
            pendingFile: null,
          }))
        : [],
      conteudo_experiencia: {
        pilares_titulo: rawExpContent.pilares_titulo ?? DEFAULT_CONTEUDO_EXPERIENCIA.pilares_titulo,
        pilares:
          Array.isArray(rawExpContent.pilares) && rawExpContent.pilares.length > 0
            ? rawExpContent.pilares
            : DEFAULT_CONTEUDO_EXPERIENCIA.pilares,
        jornada_titulo: rawExpContent.jornada_titulo ?? DEFAULT_CONTEUDO_EXPERIENCIA.jornada_titulo,
        jornada:
          Array.isArray(rawExpContent.jornada) && rawExpContent.jornada.length > 0
            ? rawExpContent.jornada
            : DEFAULT_CONTEUDO_EXPERIENCIA.jornada,
        perfil_titulo: rawExpContent.perfil_titulo ?? DEFAULT_CONTEUDO_EXPERIENCIA.perfil_titulo,
        perfis:
          Array.isArray(rawExpContent.perfis) && rawExpContent.perfis.length > 0
            ? rawExpContent.perfis
            : DEFAULT_CONTEUDO_EXPERIENCIA.perfis,
        perfil_fechamento: rawExpContent.perfil_fechamento ?? DEFAULT_CONTEUDO_EXPERIENCIA.perfil_fechamento,
      },
    });

    const roteiros = (roteiroResult.data ?? []) as any[];
    setRoteiroItems(
      roteiros.map((r) => ({ 
        localId: r.id, 
        id: r.id, 
        dia: r.dia, 
        titulo: r.titulo, 
        descricao: r.descricao, 
        imagens: r.imagens || [],
        pendingImageFile: null 
      }))
    );
    setDeletedRoteiroIds([]);
    setLoading(false);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const dataTabIndex = AVAILABLE_TABS.indexOf(tab);
  const isFirstDataTab = dataTabIndex === 0;
  const isLastDataTab = dataTabIndex === AVAILABLE_TABS.length - 1;

  function goToPrevTab() {
    setError('');
    const prev = AVAILABLE_TABS[dataTabIndex - 1];
    if (prev) setTab(prev);
  }

  function validateGeral(): boolean {
    const errs: typeof fieldErrors = {};
    if (!form.nome.trim()) errs.nome = true;
    if (!form.pais.trim()) errs.pais = true;
    if (!form.tipo_destino) errs.tipo_destino = true;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToNextTab() {
    if (tab === 'geral' && !validateGeral()) {
      return;
    }
    setError('');
    setFieldErrors({});
    const next = AVAILABLE_TABS[dataTabIndex + 1];
    if (next) setTab(next);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPhotoError('');

    const novas: { file: File; previewUrl: string }[] = [];
    
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp"
    };

    for (const originalFile of Array.from(files)) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(originalFile.type)) {
        setPhotoError('Envie apenas imagens PNG, JPG ou WEBP.');
        continue;
      }
      
      try {
        const compressedBlob = await imageCompression(originalFile, options);
        const nomeSemExtensao = originalFile.name.replace(/\.[^/.]+$/, "");
        const webpFile = new File([compressedBlob], `${nomeSemExtensao}.webp`, {
          type: "image/webp",
        });
        
        novas.push({ file: webpFile, previewUrl: URL.createObjectURL(webpFile) });
      } catch (err) {
        console.error("Erro na compressão", err);
        setPhotoError('Erro ao processar uma das imagens.');
      }
    }
    
    setPendingFiles((prev) => [...prev, ...novas]);
    e.target.value = '';
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => {
      const alvo = prev[index];
      if (alvo) URL.revokeObjectURL(alvo.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleRemoveExistingPhoto(index: number) {
    const urlRemovida = form.fotos[index];
    setDeletedFotos((prev) => [...prev, urlRemovida]);
    updateField('fotos', form.fotos.filter((_, idx) => idx !== index));
  }

  async function uploadPendingPhotos(currentId: string): Promise<string[]> {
    if (pendingFiles.length === 0) return [];
    const uploadedUrls: string[] = [];

    for (const { file } of pendingFiles) {
      const ext = file.name.split('.').pop();
      const path = `${currentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('expedicoes').upload(path, file);
      if (error) {
        setPhotoError('Não foi possível enviar uma ou mais imagens.');
        continue;
      }
      const { data } = supabase.storage.from('expedicoes').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls;
  }

  async function uploadZigueZaguePhotos(currentId: string): Promise<ZigueZagueDraftItem[]> {
    const processados = await Promise.all(
      form.blocos_ziguezague.map(async (bloco) => {
        if (bloco.pendingFile) {
          const ext = bloco.pendingFile.name.split('.').pop();
          const path = `${currentId}/ziguezague-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from('expedicoes').upload(path, bloco.pendingFile);
          if (!error) {
            const { data } = supabase.storage.from('expedicoes').getPublicUrl(path);
            return {
              id: bloco.id,
              titulo: bloco.titulo.trim(),
              texto: bloco.texto.trim(),
              imagem: data.publicUrl,
            };
          }
        }
        return {
          id: bloco.id,
          titulo: bloco.titulo.trim(),
          texto: bloco.texto.trim(),
          imagem: bloco.imagem,
        };
      })
    );
    return processados;
  }

  async function refetchRoteiro(currentId: string) {
    const { data } = await supabase
      .from('roteiros')
      .select('*')
      .eq('expedicao_id', currentId)
      .order('dia', { ascending: true })
      .order('created_at', { ascending: true });
      
    const roteiros = (data ?? []) as any[];
    setRoteiroItems(
      roteiros.map((r) => ({ 
        localId: r.id, 
        id: r.id, 
        dia: r.dia, 
        titulo: r.titulo, 
        descricao: r.descricao, 
        imagens: r.imagens || [],
        pendingImageFile: null 
      }))
    );
  }

  async function handleSave(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setPhotoError('');

    if (!validateGeral()) {
      setTab('geral');
      return;
    }

    setSaving(true);
    let currentId = expedicaoId;

    if (isNew && !currentId) {
      const { data, error } = await supabase
        .from('expedicoes')
        .insert({
          nome: form.nome.trim(),
          pais: form.pais.trim(),
          tipo_destino: form.tipo_destino,
          descricao: form.descricao.trim(),
          categorias: form.categorias,
          fotos: form.fotos,
          incluso: form.incluso,
          nao_incluso: form.nao_incluso,
          observacoes: form.observacoes,
          cor_primaria: form.cor_primaria,
          cor_secundaria: form.cor_secundaria,
          cor_fundo: form.cor_fundo,
          cor_texto: form.cor_texto,
          frase_destaque: form.frase_destaque.trim() || null,
          motivo_epoca_titulo: form.motivo_epoca_titulo.trim() || null,
          motivo_epoca_texto: form.motivo_epoca_texto.trim() || null,
          conteudo_experiencia: form.conteudo_experiencia,
        })
        .select()
        .single();

      if (error || !data) {
        setSaving(false);
        setError('Não foi possível criar a expedição. Tente novamente.');
        return;
      }
      currentId = data.id;
      setExpedicaoId(currentId);
    }

    const [novasUrls, blocosZigueZagueFinal] = await Promise.all([
      uploadPendingPhotos(currentId!),
      uploadZigueZaguePhotos(currentId!),
    ]);
    const fotosFinal = [...form.fotos, ...novasUrls];

    const { error: updateError } = await supabase
      .from('expedicoes')
      .update({
        nome: form.nome.trim(),
        pais: form.pais.trim(),
        tipo_destino: form.tipo_destino,
        descricao: form.descricao.trim(),
        categorias: form.categorias,
        fotos: fotosFinal,
        incluso: form.incluso,
        nao_incluso: form.nao_incluso,
        observacoes: form.observacoes,
        cor_primaria: form.cor_primaria,
        cor_secundaria: form.cor_secundaria,
        cor_fundo: form.cor_fundo,
        cor_texto: form.cor_texto,
        frase_destaque: form.frase_destaque.trim() || null,
        motivo_epoca_titulo: form.motivo_epoca_titulo.trim() || null,
        motivo_epoca_texto: form.motivo_epoca_texto.trim() || null,
        blocos_ziguezague: blocosZigueZagueFinal,
        conteudo_experiencia: form.conteudo_experiencia,
      })
      .eq('id', currentId);

    if (updateError) {
      setSaving(false);
      setError('Não foi possível salvar as alterações.');
      return;
    }

    if (deletedRoteiroIds.length > 0) {
      const { error: delError } = await supabase.from('roteiros').delete().in('id', deletedRoteiroIds);
      if (delError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao remover itens do roteiro.');
        return;
      }
    }

    const roteirosProcessados = await Promise.all(roteiroItems.map(async (item) => {
      if (item.pendingImageFile) {
        const ext = item.pendingImageFile.name.split('.').pop();
        const path = `${currentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('roteiros').upload(path, item.pendingImageFile);
        
        if (!error) {
          const { data } = supabase.storage.from('roteiros').getPublicUrl(path);
          return { ...item, imagens: [data.publicUrl], pendingImageFile: null };
        }
      }
      return item;
    }));

    const paraAtualizar = roteirosProcessados.filter((item) => item.id);
    for (const item of paraAtualizar) {
      const { error: updError } = await supabase
        .from('roteiros')
        .update({ 
          dia: item.dia, 
          titulo: item.titulo, 
          descricao: item.descricao, 
          imagens: item.imagens || [] 
        })
        .eq('id', item.id);
      if (updError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao atualizar o roteiro.');
        return;
      }
    }

    const paraInserir = roteirosProcessados.filter((item) => !item.id);
    if (paraInserir.length > 0) {
      const { error: insError } = await supabase.from('roteiros').insert(
        paraInserir.map((item) => ({
          expedicao_id: currentId,
          dia: item.dia,
          titulo: item.titulo,
          descricao: item.descricao,
          imagens: item.imagens || [] 
        }))
      );
      if (insError) {
        setSaving(false);
        setError('Os dados foram salvos, mas houve um problema ao adicionar itens ao roteiro.');
        return;
      }
    }

    pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingFiles([]);
    setDeletedRoteiroIds([]);

    if (deletedFotos.length > 0) {
      const pathsToRemove = deletedFotos.map((url) => {
        const parts = url.split('public/expedicoes/');
        return parts.length > 1 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (pathsToRemove.length > 0) {
        await supabase.storage.from('expedicoes').remove(pathsToRemove);
      }
    }
    setDeletedFotos([]);

    updateField('fotos', fotosFinal);
    updateField('blocos_ziguezague', blocosZigueZagueFinal);
    await refetchRoteiro(currentId!);

    setSaving(false);
    if (isNew) {
      setSuccess('Expedição criada com sucesso!');
      navigate(`/admin/expedicoes/${currentId}`, { replace: true });
      return;
    }
    setSuccess('Alterações salvas.');
  }

  const tabs: { key: Tab; label: string; disabled?: boolean; hint?: string }[] = [
    { key: 'geral', label: 'Dados Gerais' },
    { key: 'visual', label: 'Identidade Visual' },
    { key: 'conteudo_extra', label: 'Landing Page' },
    { key: 'fotos', label: 'Fotos' },
    { key: 'inclusoes', label: 'Inclusões & Observações' },
    { key: 'roteiro', label: 'Roteiro', disabled: isNew, hint: isNew ? 'Salve a expedição para liberar o roteiro' : '' },
  ];

  if (loading) {
    return (
      <div className="ui-page">
        <div className="ui-state">A carregar expedição...</div>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <style>{`
        .ui-formatted-text strong {
          font-weight: 700 !important;
          color: var(--forest-deep);
        }
        
        .ui-formatted-text em, .ui-formatted-text i {
          font-style: italic !important;
        }
        
        .ui-formatted-text del {
          text-decoration: line-through !important;
          opacity: 0.7;
        }

        .ui-section-box {
          border: 1px solid var(--beje-claro);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.5);
        }

        .ui-section-box-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--forest-deep);
          margin: 0 0 6px 0;
        }

        .ui-color-picker-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ui-color-picker-wrap input[type="color"] {
          width: 42px;
          height: 40px;
          padding: 2px;
          border: 1px solid var(--beje-claro);
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }

        .ui-palette-readonly-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 16px 0 20px;
        }

        .ui-palette-readonly-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--beje-claro);
          border-radius: 8px;
          background: #ffffff;
        }

        .ui-palette-swatch {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          flex-shrink: 0;
        }

        /* Searchable Select de Paletas */
        .ui-search-select-container {
          position: relative;
          max-width: 440px;
        }

        .ui-search-select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid var(--beje-claro);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: var(--forest-deep);
          text-align: left;
          transition: border-color 0.2s;
        }

        .ui-search-select-trigger:hover {
          border-color: #cbd5e1;
        }

        .ui-search-select-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid var(--beje-claro);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          padding: 8px;
        }

        .ui-search-select-input-wrap {
          position: relative;
          margin-bottom: 6px;
        }

        .ui-search-select-input {
          width: 100%;
          padding: 8px 10px 8px 30px;
          font-size: 13.5px;
          border: 1px solid var(--beje-claro);
          border-radius: 6px;
          outline: none;
          box-sizing: border-box;
        }

        .ui-search-select-input:focus {
          border-color: var(--forest-deep);
        }

        .ui-search-select-list {
          max-height: 220px;
          overflow-y: auto;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .ui-search-select-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--forest-deep);
          transition: background 0.15s;
        }

        .ui-search-select-option:hover {
          background: #f8fafc;
        }

        .ui-search-select-option.selected {
          background: #f1f5f9;
          font-weight: 600;
        }

        .ui-mini-swatches {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .ui-mini-swatch {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.15);
          display: inline-block;
        }
      `}</style>
      
      <Link to="/admin/expedicoes" className="ui-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para Expedições
      </Link>

      <div className="ui-page-header">
        <div>
          <h1 className="ui-page-title">{isNew ? 'Nova Expedição' : form.nome || 'Editar Expedição'}</h1>
          <p className="ui-page-subtitle">
            {isNew
              ? 'Preencha os dados e guarde para libertar o registo do roteiro.'
              : 'Atualize as informações, cores e seções da expedição.'}
          </p>
        </div>
      </div>

      <div className="ui-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ui-tab${tab === t.key ? ' active' : ''}`}
            disabled={t.disabled}
            onClick={() => setTab(t.key)}
            title={t.hint}
          >
            {t.label}
            {t.disabled && (
              <svg style={{ marginLeft: 6, opacity: 0.5 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {error && <div className="ui-form-error">{error}</div>}
      {success && <div className="ui-form-success">{success}</div>}

      <form 
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        {tab === 'geral' && (
          <>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.nome ? ' has-error' : ''}`}>
                <label htmlFor="nome">
                  Nome da Expedição <span className="ui-required">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Expedição Adriático Privé | Croácia"
                  value={form.nome}
                  onChange={(e) => {
                    updateField('nome', e.target.value);
                    if (fieldErrors.nome) setFieldErrors((f) => ({ ...f, nome: false }));
                  }}
                />
              </div>
            </div>
            <div className="ui-form-row">
              <div className={`ui-field${fieldErrors.pais ? ' has-error' : ''}`}>
                <label htmlFor="pais">
                  País <span className="ui-required">*</span>
                </label>
                <input
                  id="pais"
                  type="text"
                  placeholder="Ex: Croácia"
                  value={form.pais}
                  onChange={(e) => {
                    updateField('pais', e.target.value);
                    if (fieldErrors.pais) setFieldErrors((f) => ({ ...f, pais: false }));
                  }}
                />
              </div>
              <div className={`ui-field${fieldErrors.tipo_destino ? ' has-error' : ''}`}>
                <label htmlFor="tipo_destino">
                  Tipo de Destino <span className="ui-required">*</span>
                </label>
                <select
                  id="tipo_destino"
                  value={form.tipo_destino}
                  onChange={(e) => {
                    updateField('tipo_destino', e.target.value);
                    if (fieldErrors.tipo_destino) setFieldErrors((f) => ({ ...f, tipo_destino: false }));
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                </select>
              </div>
            </div>

            <TagListEditor
              label="Categorias"
              placeholder="Ex: Verão, Turismo de Luxo... (Enter para adicionar)"
              values={form.categorias}
              onChange={(v) => updateField('categorias', v)}
            />

            <div className="ui-field">
              <label htmlFor="frase_destaque">Frase de Destaque (Abaixo do Banner Principal)</label>
              <span className="ui-hint">
                Aparece com tipografia grande e elegante antes do texto explicativo da expedição.
              </span>
              <input
                id="frase_destaque"
                type="text"
                placeholder="Ex: Antes de convidar você para viver a Croácia, nós fomos vivê-la primeiro."
                value={form.frase_destaque}
                onChange={(e) => updateField('frase_destaque', e.target.value)}
              />
            </div>

            <div className="ui-field">
              <label htmlFor="descricao">Descrição Principal</label>
              <textarea
                id="descricao"
                placeholder="Conte a experiência que essa expedição oferece..."
                value={form.descricao}
                onChange={(e) => updateField('descricao', e.target.value)}
                style={{ minHeight: 140 }}
              />
            </div>
          </>
        )}

        {tab === 'visual' && (
          <>
            <div className="ui-section-box">
              <h3 className="ui-section-box-title">Paletas Salvas (Temas do Sistema)</h3>
              <p className="ui-hint" style={{ marginBottom: 14 }}>
                Busque pelo nome e selecione uma paleta cadastrada para preencher as cores automaticamente.
              </p>
              
              <SearchablePaletteSelect
                paletas={paletasSalvas}
                selectedId={selectedPaletaId}
                onSelect={(paleta) => {
                  setSelectedPaletaId(paleta.id);
                  updateField('cor_primaria', paleta.cor_primaria);
                  updateField('cor_secundaria', paleta.cor_secundaria);
                  updateField('cor_fundo', paleta.cor_fundo);
                  updateField('cor_texto', paleta.cor_texto);
                }}
              />
            </div>

            <div className="ui-section-box">
              <h3 className="ui-section-box-title">Personalização de Cores (Hexadecimal)</h3>
              <p className="ui-hint" style={{ marginBottom: 18 }}>
                Escolha as cores nos seletores abaixo. Caso goste da combinação, você pode salvá-la como uma nova paleta para usar em outras expedições.
              </p>

              <div className="ui-form-row">
                <div className="ui-field">
                  <label>Cor Primária (Títulos, Botões Ativos, Destaques)</label>
                  <div className="ui-color-picker-wrap">
                    <input
                      type="color"
                      value={form.cor_primaria}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_primaria', e.target.value);
                      }}
                    />
                    <input
                      type="text"
                      value={form.cor_primaria}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_primaria', e.target.value);
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="ui-field">
                  <label>Cor Secundária (Botão CTA, Subtítulos, Ícones)</label>
                  <div className="ui-color-picker-wrap">
                    <input
                      type="color"
                      value={form.cor_secundaria}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_secundaria', e.target.value);
                      }}
                    />
                    <input
                      type="text"
                      value={form.cor_secundaria}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_secundaria', e.target.value);
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="ui-form-row">
                <div className="ui-field">
                  <label>Cor de Fundo Suave (Seções Alternadas)</label>
                  <div className="ui-color-picker-wrap">
                    <input
                      type="color"
                      value={form.cor_fundo}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_fundo', e.target.value);
                      }}
                    />
                    <input
                      type="text"
                      value={form.cor_fundo}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_fundo', e.target.value);
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="ui-field">
                  <label>Cor do Texto Principal</label>
                  <div className="ui-color-picker-wrap">
                    <input
                      type="color"
                      value={form.cor_texto}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_texto', e.target.value);
                      }}
                    />
                    <input
                      type="text"
                      value={form.cor_texto}
                      onChange={(e) => {
                        setSelectedPaletaId('');
                        updateField('cor_texto', e.target.value);
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Botão para abrir o Modal de Salvar Paleta */}
              <div style={{ marginTop: 4, marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="ui-btn-ghost"
                  onClick={openPaletteModal}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Salvar cores atuais como nova paleta
                </button>
              </div>

              {/* Prévia Ao Vivo */}
              <div
                style={{
                  padding: 24,
                  borderRadius: 12,
                  backgroundColor: form.cor_fundo,
                  color: form.cor_texto,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: form.cor_secundaria,
                    marginBottom: 6,
                  }}
                >
                  PRÉVIA DA IDENTIDADE VISUAL
                </div>
                <h4
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 24,
                    color: form.cor_primaria,
                    margin: '0 0 10px 0',
                  }}
                >
                  {form.nome || 'Expedição Exemplo'}
                </h4>
                <p style={{ fontSize: 14, margin: '0 0 16px 0', opacity: 0.85 }}>
                  {form.frase_destaque ||
                    'Antes de convidar você para viver este destino, nós fomos vivê-lo primeiro.'}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    borderRadius: 8,
                    backgroundColor: form.cor_secundaria,
                    color: '#151e1b',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  QUERO ME INSCREVER →
                </span>
              </div>
            </div>
          </>
        )}

        {tab === 'conteudo_extra' && (
          <>
            {/* 1. Motivo da Época (Ex: Por que junho?) */}
            <div className="ui-section-box">
              <h3 className="ui-section-box-title">Seção: Defesa da Época / Mês (Ex: "Por que junho?")</h3>
              <p className="ui-hint" style={{ marginBottom: 16 }}>
                Aparece junto à área do roteiro explicando por que a data foi escolhida estrategicamente.
              </p>
              <div className="ui-field">
                <label>Título da Seção</label>
                <input
                  type="text"
                  placeholder="Ex: Por que junho?"
                  value={form.motivo_epoca_titulo}
                  onChange={(e) => updateField('motivo_epoca_titulo', e.target.value)}
                />
              </div>
              <div className="ui-field" style={{ marginBottom: 0 }}>
                <label>Texto Explicativo</label>
                <textarea
                  placeholder="Ex: Junho marca o início do verão europeu, oferecendo dias longos e clima perfeito..."
                  value={form.motivo_epoca_texto}
                  onChange={(e) => updateField('motivo_epoca_texto', e.target.value)}
                  style={{ minHeight: 110 }}
                />
              </div>
            </div>

            {/* 2. Blocos Zigue-Zague */}
            <ZigueZagueEditor
              items={form.blocos_ziguezague}
              onChange={(novos) => updateField('blocos_ziguezague', novos)}
            />

            {/* 3. Pilares & Jornada */}
            <div className="ui-section-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 className="ui-section-box-title">Pilares & Jornada da Experiência</h3>
                  <p className="ui-hint" style={{ margin: 0 }}>
                    Combina a Proposta 2 (Pilares) e a Proposta 1 (Jornada).
                  </p>
                </div>
                <button
                  type="button"
                  className="ui-btn-ghost"
                  onClick={() => updateField('conteudo_experiencia', DEFAULT_CONTEUDO_EXPERIENCIA)}
                >
                  Restaurar Textos Padrão
                </button>
              </div>

              <div className="ui-field">
                <label>Título dos Pilares</label>
                <input
                  type="text"
                  value={form.conteudo_experiencia.pilares_titulo}
                  onChange={(e) =>
                    updateField('conteudo_experiencia', {
                      ...form.conteudo_experiencia,
                      pilares_titulo: e.target.value,
                    })
                  }
                />
              </div>

              {form.conteudo_experiencia.pilares.map((pilar, idx) => (
                <div className="ui-form-row" key={`pilar-${idx}`}>
                  <div className="ui-field" style={{ flex: 1 }}>
                    <label>Pilar {idx + 1}</label>
                    <input
                      type="text"
                      value={pilar.titulo}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.pilares];
                        novos[idx] = { ...novos[idx], titulo: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, pilares: novos });
                      }}
                    />
                  </div>
                  <div className="ui-field" style={{ flex: 2 }}>
                    <label>Descrição do Pilar {idx + 1}</label>
                    <input
                      type="text"
                      value={pilar.descricao}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.pilares];
                        novos[idx] = { ...novos[idx], descricao: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, pilares: novos });
                      }}
                    />
                  </div>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid var(--beje-claro)', margin: '16px 0' }} />

              <div className="ui-field">
                <label>Título da Jornada</label>
                <input
                  type="text"
                  value={form.conteudo_experiencia.jornada_titulo}
                  onChange={(e) =>
                    updateField('conteudo_experiencia', {
                      ...form.conteudo_experiencia,
                      jornada_titulo: e.target.value,
                    })
                  }
                />
              </div>

              {form.conteudo_experiencia.jornada.map((item, idx) => (
                <div className="ui-form-row" key={`jornada-${idx}`}>
                  <div className="ui-field" style={{ flex: 1 }}>
                    <label>Etapa {idx + 1}</label>
                    <input
                      type="text"
                      value={item.etapa}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.jornada];
                        novos[idx] = { ...novos[idx], etapa: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, jornada: novos });
                      }}
                    />
                  </div>
                  <div className="ui-field" style={{ flex: 2 }}>
                    <label>Descrição da Etapa {idx + 1}</label>
                    <input
                      type="text"
                      value={item.descricao}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.jornada];
                        novos[idx] = { ...novos[idx], descricao: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, jornada: novos });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Essa viagem é pra mim? */}
            <div className="ui-section-box">
              <h3 className="ui-section-box-title">Seção: "Essa viagem é pra mim?" (Quebra de Objeções)</h3>
              <div className="ui-field">
                <label>Título da Seção</label>
                <input
                  type="text"
                  value={form.conteudo_experiencia.perfil_titulo}
                  onChange={(e) =>
                    updateField('conteudo_experiencia', {
                      ...form.conteudo_experiencia,
                      perfil_titulo: e.target.value,
                    })
                  }
                />
              </div>

              {form.conteudo_experiencia.perfis.map((perf, idx) => (
                <div className="ui-form-row" key={`perfil-${idx}`}>
                  <div className="ui-field" style={{ flex: 1 }}>
                    <label>Perfil {idx + 1}</label>
                    <input
                      type="text"
                      value={perf.titulo}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.perfis];
                        novos[idx] = { ...novos[idx], titulo: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, perfis: novos });
                      }}
                    />
                  </div>
                  <div className="ui-field" style={{ flex: 2 }}>
                    <label>Texto do Perfil {idx + 1}</label>
                    <input
                      type="text"
                      value={perf.descricao}
                      onChange={(e) => {
                        const novos = [...form.conteudo_experiencia.perfis];
                        novos[idx] = { ...novos[idx], descricao: e.target.value };
                        updateField('conteudo_experiencia', { ...form.conteudo_experiencia, perfis: novos });
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="ui-field" style={{ marginBottom: 0 }}>
                <label>Frase de Fechamento da Seção</label>
                <input
                  type="text"
                  value={form.conteudo_experiencia.perfil_fechamento}
                  onChange={(e) =>
                    updateField('conteudo_experiencia', {
                      ...form.conteudo_experiencia,
                      perfil_fechamento: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {tab === 'fotos' && (
          <div className="ui-field">
            <label>Fotos</label>
            <p className="ui-hint">
              Envie imagens do computador (PNG, JPG ou WEBP). Elas são comprimidas automaticamente em WebP e enviadas ao clicar em Salvar.
            </p>
            {photoError && <div className="ui-form-error">{photoError}</div>}
            <label className={`ui-file-upload${saving ? ' disabled' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
              Selecionar fotos
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={saving}
                onChange={handleFileSelect}
              />
            </label>

            {(form.fotos.length > 0 || pendingFiles.length > 0) && (
              <div className="ui-photo-grid">
                {form.fotos.map((url, i) => (
                  <div className="ui-photo-thumb" key={`existing-${url}-${i}`}>
                    <img src={url} alt={`Foto ${i + 1}`} />
                    <button
                      type="button"
                      className="ui-photo-remove"
                      onClick={() => handleRemoveExistingPhoto(i)}
                      title="Remover"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {pendingFiles.map((p, i) => (
                  <div className="ui-photo-thumb" key={`pending-${i}`}>
                    <img src={p.previewUrl} alt={`Nova foto ${i + 1}`} />
                    <span className="ui-photo-pending-badge">Nova</span>
                    <button
                      type="button"
                      className="ui-photo-remove"
                      onClick={() => removePendingFile(i)}
                      title="Remover"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'inclusoes' && (
          <>
            <ListEditor
              label="O que está incluído"
              placeholder="Ex: Pequeno-almoço, transporte..."
              values={form.incluso}
              onChange={(v) => updateField('incluso', v)}
            />
            <ListEditor
              label="O que não está incluído"
              placeholder="Ex: Voos, seguro de viagem..."
              values={form.nao_incluso}
              onChange={(v) => updateField('nao_incluso', v)}
            />
            <ListEditor
              label="Observações"
              placeholder="Ex: Necessário preparo físico intermédio..."
              values={form.observacoes}
              onChange={(v) => updateField('observacoes', v)}
            />
          </>
        )}

        {tab === 'roteiro' && !isNew && (
          <RoteiroEditor
            items={roteiroItems}
            setItems={setRoteiroItems}
            onMarkDeleted={(ids) => setDeletedRoteiroIds((prev) => [...prev, ...ids])}
          />
        )}

        <div className="ui-step-actions">
          {!isFirstDataTab ? (
            <button type="button" className="ui-btn-ghost" onClick={goToPrevTab} disabled={saving}>
              Voltar
            </button>
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isNew && !isLastDataTab && (
              <button type="button" className="ui-btn-ghost" disabled={saving} onClick={handleSave}>
                {saving ? 'A salvar...' : 'Salvar Agora'}
              </button>
            )}

            {isLastDataTab ? (
              <button type="button" className="ui-btn-solid" disabled={saving} onClick={handleSave}>
                {saving ? 'A salvar...' : 'Salvar Expedição'}
              </button>
            ) : (
              <button type="button" className="ui-btn-solid" onClick={goToNextTab}>
                Próximo
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ==========================================
          MODAL: SALVAR NOVA PALETA DE CORES
          ========================================== */}
      {paletteModalOpen && (
        <div className="ui-modal-overlay" onClick={closePaletteModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">Salvar Nova Paleta</h2>
              <button type="button" className="ui-modal-close" onClick={closePaletteModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {paletteModalError && <div className="ui-form-error">{paletteModalError}</div>}

            <p className="ui-hint" style={{ marginTop: 0, marginBottom: 12 }}>
              Confira abaixo as cores selecionadas (somente leitura) e dê um nome para cadastrar esta paleta no sistema:
            </p>

            {/* Exibição das cores bloqueadas (somente leitura) */}
            <div className="ui-palette-readonly-grid">
              <div className="ui-palette-readonly-item">
                <span className="ui-palette-swatch" style={{ backgroundColor: form.cor_primaria }} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600 }}>Primária</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-deep)' }}>
                    {form.cor_primaria.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="ui-palette-readonly-item">
                <span className="ui-palette-swatch" style={{ backgroundColor: form.cor_secundaria }} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600 }}>Secundária</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-deep)' }}>
                    {form.cor_secundaria.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="ui-palette-readonly-item">
                <span className="ui-palette-swatch" style={{ backgroundColor: form.cor_fundo }} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600 }}>Fundo</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-deep)' }}>
                    {form.cor_fundo.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="ui-palette-readonly-item">
                <span className="ui-palette-swatch" style={{ backgroundColor: form.cor_texto }} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600 }}>Texto</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--forest-deep)' }}>
                    {form.cor_texto.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-field">
              <label htmlFor="paletteName">
                Nome da Paleta <span className="ui-required">*</span>
              </label>
              <input
                id="paletteName"
                type="text"
                placeholder="Ex: Costa Amalfitana (Azul & Limão)"
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNewPalette(e);
                  }
                }}
              />
            </div>

            <div className="ui-modal-footer" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="ui-btn-ghost"
                onClick={closePaletteModal}
                disabled={savingPalette}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ui-btn-solid"
                onClick={handleSaveNewPalette}
                disabled={savingPalette}
              >
                {savingPalette ? 'Salvando...' : 'Salvar Paleta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Searchable Select para Paletas de Cores
function SearchablePaletteSelect({
  paletas,
  selectedId,
  onSelect,
}: {
  paletas: PaletaTema[];
  selectedId: string;
  onSelect: (paleta: PaletaTema) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedPalette = useMemo(
    () => paletas.find((p) => p.id === selectedId),
    [paletas, selectedId]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return paletas;
    return paletas.filter((p) => p.nome.toLowerCase().includes(term));
  }, [paletas, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="ui-search-select-container" ref={containerRef}>
      <button
        type="button"
        className="ui-search-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {selectedPalette ? (
            <>
              <span className="ui-mini-swatches">
                <span className="ui-mini-swatch" style={{ backgroundColor: selectedPalette.cor_primaria }} />
                <span className="ui-mini-swatch" style={{ backgroundColor: selectedPalette.cor_secundaria }} />
                <span className="ui-mini-swatch" style={{ backgroundColor: selectedPalette.cor_fundo }} />
              </span>
              <span>{selectedPalette.nome}</span>
            </>
          ) : (
            <span style={{ opacity: 0.6 }}>Buscar ou selecionar uma paleta...</span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="ui-search-select-dropdown">
          <div className="ui-search-select-input-wrap">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.45,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="ui-search-select-input"
              placeholder="Digite o nome da paleta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ul className="ui-search-select-list">
            {filtered.length === 0 ? (
              <li style={{ padding: '12px 10px', fontSize: 13, opacity: 0.6, textAlign: 'center' }}>
                Nenhuma paleta encontrada.
              </li>
            ) : (
              filtered.map((paleta) => {
                const isSelected = paleta.id === selectedId;
                return (
                  <li
                    key={paleta.id}
                    className={`ui-search-select-option${isSelected ? ' selected' : ''}`}
                    onClick={() => {
                      onSelect(paleta);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span>{paleta.nome}</span>
                    <span className="ui-mini-swatches">
                      <span className="ui-mini-swatch" style={{ backgroundColor: paleta.cor_primaria }} />
                      <span className="ui-mini-swatch" style={{ backgroundColor: paleta.cor_secundaria }} />
                      <span className="ui-mini-swatch" style={{ backgroundColor: paleta.cor_fundo }} />
                      <span className="ui-mini-swatch" style={{ backgroundColor: paleta.cor_texto }} />
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ZigueZagueEditor({
  items,
  onChange,
}: {
  items: ZigueZagueDraftItem[];
  onChange: (items: ZigueZagueDraftItem[]) => void;
}) {
  function addBloco() {
    onChange([
      ...items,
      {
        id: uid(),
        titulo: 'Experiência Exclusiva no Destino',
        texto:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivencie momentos únicos planejados com curadoria presencial e atenção a cada detalhe.',
        imagem: '',
        pendingFile: null,
      },
    ]);
  }

  function updateBloco(index: number, partial: Partial<ZigueZagueDraftItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  }

  function removeBloco(index: number) {
    onChange(items.filter((_, idx) => idx !== index));
  }

  async function handleBlocoImage(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    };

    try {
      const compressedBlob = await imageCompression(originalFile, options);
      const nomeSemExtensao = originalFile.name.replace(/\.[^/.]+$/, '');
      const webpFile = new File([compressedBlob], `${nomeSemExtensao}.webp`, {
        type: 'image/webp',
      });
      const previewUrl = URL.createObjectURL(webpFile);
      updateBloco(index, { imagem: previewUrl, pendingFile: webpFile });
    } catch (err) {
      console.error('Erro ao comprimir imagem do bloco', err);
    }
  }

  return (
    <div className="ui-section-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 className="ui-section-box-title">Layout Alternado (Blocos Zigue-Zague)</h3>
          <p className="ui-hint" style={{ margin: 0 }}>
            Intercala automaticamente Foto à Esquerda + Texto à Direita, seguido de Texto à Esquerda + Foto à Direita.
          </p>
        </div>
        <button type="button" className="ui-btn-ghost" onClick={addBloco}>
          + Adicionar Bloco Zigue-Zague
        </button>
      </div>

      {items.length === 0 && (
        <p style={{ fontSize: 13.5, opacity: 0.6, margin: '8px 0 0' }}>
          Nenhum bloco cadastrado ainda. Clique em "+ Adicionar Bloco Zigue-Zague" para testar.
        </p>
      )}

      {items.map((bloco, i) => (
        <div
          key={bloco.id}
          style={{
            border: '1px dashed var(--beje-claro)',
            borderRadius: 8,
            padding: 16,
            marginTop: 14,
            background: 'var(--warm-white)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--forest-deep)' }}>
              Bloco {i + 1} ({i % 2 === 0 ? 'Foto na Esquerda / Texto na Direita' : 'Texto na Esquerda / Foto na Direita'})
            </strong>
            <button
              type="button"
              className="ui-icon-btn danger"
              onClick={() => removeBloco(i)}
              title="Remover Bloco"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </div>

          <div className="ui-field">
            <label>Título do Bloco</label>
            <input
              type="text"
              placeholder="Ex: Navegação privativa pelas ilhas"
              value={bloco.titulo}
              onChange={(e) => updateBloco(i, { titulo: e.target.value })}
            />
          </div>

          <div className="ui-field">
            <label>Texto do Bloco</label>
            <textarea
              placeholder="Descreva este destaque da expedição..."
              value={bloco.texto}
              onChange={(e) => updateBloco(i, { texto: e.target.value })}
              style={{ minHeight: 80 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label className="ui-file-upload">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              </svg>
              Enviar Foto do Bloco
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleBlocoImage(i, e)} />
            </label>

            {bloco.imagem && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={bloco.imagem}
                  alt={`Bloco ${i + 1}`}
                  style={{ width: 90, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--beje-claro)' }}
                />
                {bloco.pendingFile && <span className="ui-photo-pending-badge" style={{ position: 'static' }}>Nova WebP</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TagListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const v = draft.trim();
    if (!v || values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  }

  return (
    <div className="ui-field">
      <label>{label}</label>
      <div className="ui-tag-input-row">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <button type="button" className="ui-btn-ghost" onClick={addTag}>
          Adicionar
        </button>
      </div>
      {values.length > 0 && (
        <div className="ui-tag-list">
          {values.map((v) => (
            <span className="ui-tag" key={v}>
              {v}
              <button type="button" onClick={() => onChange(values.filter((item) => item !== v))}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  function updateAt(i: number, value: string) {
    const next = [...values];
    next[i] = value;
    onChange(next);
  }

  function removeAt(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  return (
    <div className="ui-field">
      <label>{label}</label>
      {values.map((v, i) => (
        <div className="ui-list-editor-row" key={i}>
          <input type="text" value={v} placeholder={placeholder} onChange={(e) => updateAt(i, e.target.value)} />
          <button type="button" className="ui-icon-btn danger" onClick={() => removeAt(i)} title="Remover">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" className="ui-btn-ghost" onClick={() => onChange([...values, ''])}>
        + Adicionar item
      </button>
    </div>
  );
}

function RoteiroEditor({
  items,
  setItems,
  onMarkDeleted,
}: {
  items: RoteiroDraftItem[];
  setItems: React.Dispatch<React.SetStateAction<RoteiroDraftItem[]>>;
  onMarkDeleted: (ids: string[]) => void;
}) {
  const [expandedDias, setExpandedDias] = useState<Set<number>>(new Set());
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [dayForm, setDayForm] = useState<{dia: string, titulo: string, descricao: string, imagens: string[], pendingImageFile: File | null}>({ 
    dia: '', titulo: '', descricao: '', imagens: [], pendingImageFile: null 
  });
  
  const [modalError, setModalError] = useState('');

  const diasOrdenados = useMemo(() => {
    return [...items].sort((a, b) => a.dia - b.dia);
  }, [items]);

  function toggleDia(dia: number) {
    setExpandedDias((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  }

  function openAddModal() {
    const proximoDia = diasOrdenados.length > 0 ? Math.max(...diasOrdenados.map((d) => d.dia)) + 1 : 1;
    setEditingId(null);
    setDayForm({ dia: String(proximoDia), titulo: '', descricao: '', imagens: [], pendingImageFile: null });
    setModalError('');
    setModalOpen(true);
  }

  function openEditModal(item: RoteiroDraftItem) {
    setEditingId(item.localId);
    setDayForm({ 
      dia: String(item.dia), 
      titulo: item.titulo, 
      descricao: item.descricao, 
      imagens: item.imagens || [], 
      pendingImageFile: item.pendingImageFile || null 
    });
    setModalError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleImageSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;
    setModalError('');

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp"
    };

    try {
      const compressedBlob = await imageCompression(originalFile, options);
      const nomeSemExtensao = originalFile.name.replace(/\.[^/.]+$/, "");
      const webpFile = new File([compressedBlob], `${nomeSemExtensao}.webp`, {
        type: "image/webp",
      });

      const previewUrl = URL.createObjectURL(webpFile);
      
      setDayForm(prev => ({ 
        ...prev, 
        imagens: [previewUrl],
        pendingImageFile: webpFile
      }));
    } catch (err) {
      console.error("Erro na compressão", err);
      setModalError('Erro ao comprimir imagem do roteiro.');
    }
  }

  function submitModal(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    setModalError('');
    
    const diaNum = Number(dayForm.dia);
    if (!diaNum || diaNum < 1) {
      setModalError('Informe um dia válido (1, 2, 3...).');
      return;
    }
    if (!dayForm.titulo.trim()) {
      setModalError('O título do dia é obrigatório.');
      return;
    }

    if (editingId) {
      setItems((prev) =>
        prev.map((i) =>
          i.localId === editingId
            ? { ...i, dia: diaNum, titulo: dayForm.titulo.trim(), descricao: dayForm.descricao.trim(), imagens: dayForm.imagens, pendingImageFile: dayForm.pendingImageFile }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        { localId: uid(), dia: diaNum, titulo: dayForm.titulo.trim(), descricao: dayForm.descricao.trim(), imagens: dayForm.imagens, pendingImageFile: dayForm.pendingImageFile },
      ]);
      setExpandedDias((prev) => new Set(prev).add(diaNum));
    }
    closeModal();
  }

  function handleDelete(item: RoteiroDraftItem) {
    const confirmado = window.confirm(`Remover o Dia ${item.dia} do roteiro?`);
    if (!confirmado) return;

    if (item.id) onMarkDeleted([item.id]);
    setItems((prev) => prev.filter((i) => i.localId !== item.localId));
  }

  return (
    <div>
      <div className="ui-page-header" style={{ marginBottom: 8 }}>
        <p className="ui-page-subtitle" style={{ margin: 0 }}>
          Cadastre o cronograma e os acontecimentos de cada dia da expedição.
        </p>
        <button type="button" className="ui-btn-solid" onClick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Adicionar Dia
        </button>
      </div>

      <p className="ui-hint" style={{ marginBottom: 20 }}>
        Os dias adicionados ficam pendentes até clicar em Salvar Expedição, no final do formulário.
      </p>

      {diasOrdenados.length === 0 && (
        <div className="ui-empty">
          <p>Nenhum dia de roteiro registado ainda.</p>
          <button type="button" className="ui-btn-solid" onClick={openAddModal}>
            Adicionar primeiro dia
          </button>
        </div>
      )}

      {diasOrdenados.map((item) => {
        const isOpen = expandedDias.has(item.dia);
        return (
          <div className="ui-accordion" key={item.localId}>
            <div className="ui-accordion-header" onClick={() => toggleDia(item.dia)}>
              <div className="ui-accordion-header-left">
                <svg
                  className={`ui-accordion-chevron${isOpen ? ' open' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
                <p className="ui-accordion-title">Dia {item.dia} - {item.titulo}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="ui-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(item);
                  }}
                  title="Editar Dia"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ui-icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  title="Remover Dia"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="ui-accordion-body" style={{ lineHeight: '1.6', fontSize: '14.5px', color: 'var(--ink)' }}>
                {item.descricao ? (
                   <div 
                     className="ui-formatted-text" 
                     dangerouslySetInnerHTML={formatarEstiloWhatsApp(item.descricao)} 
                   />
                ) : (
                  <em style={{ opacity: 0.5 }}>Nenhuma descrição informada.</em>
                )}
                
                {item.imagens && item.imagens.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <img 
                      src={item.imagens[0]} 
                      alt={`Imagem do dia ${item.dia}`} 
                      style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--beje-claro)' }} 
                    />
                    {item.pendingImageFile && (
                      <span className="ui-photo-pending-badge" style={{ position: 'relative', display: 'inline-block', top: '-10px', left: '10px' }}>Pendente</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {modalOpen && (
        <div className="ui-modal-overlay" onClick={closeModal}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="ui-modal-header">
              <h2 className="ui-modal-title">{editingId ? 'Editar Dia' : 'Adicionar Dia'}</h2>
              <button type="button" className="ui-modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              {modalError && <div className="ui-form-error">{modalError}</div>}
              
              <div className="ui-form-row">
                <div className="ui-field" style={{ maxWidth: 110 }}>
                  <label htmlFor="dayNumber">Dia</label>
                  <input
                    id="dayNumber"
                    type="number"
                    min={1}
                    step={1}
                    value={dayForm.dia}
                    onChange={(e) => setDayForm(f => ({...f, dia: e.target.value}))}
                    required
                  />
                </div>
                <div className="ui-field" style={{ flex: 1 }}>
                  <label htmlFor="dayTitle">Título do Dia</label>
                  <input
                    id="dayTitle"
                    type="text"
                    placeholder="Ex: Chegada em Split e embarque"
                    value={dayForm.titulo}
                    onChange={(e) => setDayForm(f => ({...f, titulo: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="ui-field">
                <label htmlFor="dayDesc">Descrição Completa</label>
                <textarea
                  id="dayDesc"
                  placeholder="Descreva o que vai acontecer neste dia...&#10;Use *texto* para negrito, _texto_ para itálico e ~texto~ para riscado."
                  value={dayForm.descricao}
                  onChange={(e) => setDayForm(f => ({...f, descricao: e.target.value}))}
                  style={{ minHeight: 180, lineHeight: 1.5 }}
                />
                <span className="ui-hint" style={{ marginTop: '4px' }}>
                  <strong>Dica de formatação:</strong> Igual ao WhatsApp! Envolva a palavra em <strong>*asterisco*</strong> para negrito, <i>_underline_</i> para itálico ou <del>~til~</del> para riscado.
                </span>
              </div>

              <div className="ui-field" style={{ marginTop: '16px' }}>
                <label>Imagem do Dia (Opcional)</label>
                <label className="ui-file-upload" style={{ marginTop: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                  </svg>
                  Selecionar Foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageSelection}
                  />
                </label>

                {dayForm.imagens && dayForm.imagens.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--beje-claro)', borderRadius: '8px', display: 'inline-block' }}>
                    <img 
                      src={dayForm.imagens[0]} 
                      alt="Preview" 
                      style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} 
                    />
                    <button 
                      type="button"
                      onClick={() => setDayForm(prev => ({ ...prev, imagens: [], pendingImageFile: null }))}
                      style={{ marginTop: '12px', color: '#be123c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                      Remover Imagem
                    </button>
                  </div>
                )}
              </div>

              <div className="ui-modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="ui-btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="button" className="ui-btn-solid" onClick={submitModal}>
                  {editingId ? 'Concluir' : 'Adicionar Dia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}