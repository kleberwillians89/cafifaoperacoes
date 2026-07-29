begin;

-- Importação CAFIFA compatível com o schema real de 202607290001_schema.sql.
-- Fonte preservada: 012_import_official_checklist.sql.
-- Total oficial: 88 áreas, 168 tarefas, 11 marcos e 12 categorias.
-- Este script não cria nem altera schema, enums, funções, RLS ou Storage.

do $$
declare
  project_count integer;
  stage_count integer;
begin
  select count(*) into project_count
  from public.projects
  where slug = 'cafifa-operacoes';

  if project_count <> 1 then
    raise exception
      'Importação cancelada: esperado exatamente 1 projeto com slug cafifa-operacoes; encontrado %',
      project_count;
  end if;

  select count(*) into stage_count
  from public.project_stages s
  join public.projects p on p.id = s.project_id
  where p.slug = 'cafifa-operacoes'
    and s.source_key in (
      'stage-week-01', 'stage-week-02', 'stage-week-03', 'stage-week-04',
      'stage-week-05', 'stage-week-06', 'stage-week-07', 'stage-week-08',
      'stage-week-09', 'stage-week-10', 'stage-week-11',
      'stage-event-day', 'stage-post-event'
    );

  if stage_count <> 13 then
    raise exception
      'Importação cancelada: esperadas as 13 etapas oficiais existentes; encontradas %',
      stage_count;
  end if;
end
$$;

with p as (
  select id from public.projects where slug='cafifa-operacoes'
),
area_data(name,slug,sort_order) as (
  values
  ('Acessibilidade', 'acessibilidade', 1),
  ('Administração', 'administracao', 2),
  ('Ambiental', 'ambiental', 3),
  ('Arena / apoio', 'arena-apoio', 4),
  ('Armazenamento', 'armazenamento', 5),
  ('Arquivo', 'arquivo', 6),
  ('Atletas', 'atletas', 7),
  ('Atletas / mídia', 'atletas-midia', 8),
  ('Autorizações', 'autorizacoes', 9),
  ('Banco de dados', 'banco-de-dados', 10),
  ('Briefing final', 'briefing-final', 11),
  ('Camisas', 'camisas', 12),
  ('Captação', 'captacao', 13),
  ('Carga 1', 'carga-1', 14),
  ('Carga 2', 'carga-2', 15),
  ('Cerimonial / bênção', 'cerimonial-bencao', 16),
  ('Checkpoint', 'checkpoint', 17),
  ('Clima', 'clima', 18),
  ('Cobertura', 'cobertura', 19),
  ('Comando', 'comando', 20),
  ('Comunicação', 'comunicacao', 21),
  ('Comunidade', 'comunidade', 22),
  ('Contrapartidas', 'contrapartidas', 23),
  ('Contratos', 'contratos', 24),
  ('Controle', 'controle', 25),
  ('Crise', 'crise', 26),
  ('Cronometragem', 'cronometragem', 27),
  ('Desmobilização / debrief', 'desmobilizacao-debrief', 28),
  ('Documentos', 'documentos', 29),
  ('Emergência', 'emergencia', 30),
  ('Equipe', 'equipe', 31),
  ('Escopo', 'escopo', 32),
  ('Estrutura', 'estrutura', 33),
  ('Financeiro', 'financeiro', 34),
  ('Foto/Vídeo', 'foto-video', 35),
  ('Go/No-Go', 'go-no-go', 36),
  ('Governança', 'governanca', 37),
  ('Gráfica', 'grafica', 38),
  ('Guia do Atleta', 'guia-do-atleta', 39),
  ('Hidratação', 'hidratacao', 40),
  ('ICMBio', 'icmbio', 41),
  ('Identidade', 'identidade', 42),
  ('Imprensa', 'imprensa', 43),
  ('Incidentes', 'incidentes', 44),
  ('Inclusão local', 'inclusao-local', 45),
  ('Inscrições', 'inscricoes', 46),
  ('Institucional', 'institucional', 47),
  ('Inventário', 'inventario', 48),
  ('Jurídico', 'juridico', 49),
  ('Kits', 'kits', 50),
  ('LGPD', 'lgpd', 51),
  ('Lançamento', 'lancamento', 52),
  ('Largada', 'largada', 53),
  ('Legado', 'legado', 54),
  ('Lições aprendidas', 'licoes-aprendidas', 55),
  ('Logística', 'logistica', 56),
  ('Marketing', 'marketing', 57),
  ('Materiais', 'materiais', 58),
  ('Medalhas', 'medalhas', 59),
  ('Montagem', 'montagem', 60),
  ('Mídia', 'midia', 61),
  ('Mídia paga', 'midia-paga', 62),
  ('Operação', 'operacao', 63),
  ('Operações', 'operacoes', 64),
  ('Paróquia', 'paroquia', 65),
  ('Patrocinadores', 'patrocinadores', 66),
  ('Patrocínio', 'patrocinio', 67),
  ('Percurso', 'percurso', 68),
  ('Premiação', 'premiacao', 69),
  ('Produção', 'producao', 70),
  ('Prontidão', 'prontidao', 71),
  ('Qualidade', 'qualidade', 72),
  ('Regulamento', 'regulamento', 73),
  ('Resultado', 'resultado', 74),
  ('Sala de situação', 'sala-de-situacao', 75),
  ('Sanitários', 'sanitarios', 76),
  ('Saúde', 'saude', 77),
  ('Segurança', 'seguranca', 78),
  ('Seguro', 'seguro', 79),
  ('Sinalização', 'sinalizacao', 80),
  ('Site', 'site', 81),
  ('Staff', 'staff', 82),
  ('Trade', 'trade', 83),
  ('Transporte', 'transporte', 84),
  ('Varredura', 'varredura', 85),
  ('Viagem', 'viagem', 86),
  ('Visita técnica', 'visita-tecnica', 87),
  ('Voluntários', 'voluntarios', 88)
)
insert into public.areas(project_id,name,slug,sort_order)
select p.id,a.name,a.slug,a.sort_order
from p cross join area_data a
on conflict (project_id,slug) do update
set name=excluded.name, slug=excluded.slug, sort_order=excluded.sort_order, updated_at=now();

with p as (
  select id from public.projects where slug='cafifa-operacoes'
),
task_data(
  stage_source_key, original_area_label, title, original_responsible_label,
  original_due_date_label, original_status_label, original_priority_label,
  normalized_status, normalized_priority, normalized_type, source_key,
  due_date, metadata_text
) as (
  values
  ('stage-week-01','Governança','Realizar kick-off executivo e confirmar objetivo, formato, capacidade e entregas essenciais da etapa.','Guga + Núcleo','28/07','EM CURSO','CRÍTICO','in_progress','critical','task','task-stage-week-01-001',date '2026-07-28','{}'),
  ('stage-week-01','Governança','Definir RACI: responsável, aprovador, consultado e informado para cada frente.','Coord. Geral','29/07','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-002',date '2026-07-29','{}'),
  ('stage-week-01','Escopo','Congelar versão preliminar do escopo: corrida, categorias, experiência, premiação e presença comunitária.','Coord. Geral','30/07','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-003',date '2026-07-30','{}'),
  ('stage-week-01','Financeiro','Montar orçamento mínimo, provável e ideal, com caixa semanal e datas de desembolso.','Financeiro','31/07','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-004',date '2026-07-31','{}'),
  ('stage-week-01','Captação','Criar pipeline de patrocinadores por prioridade, valor, contato, decisor e próximo passo.','Comercial','29/07','EM CURSO','CRÍTICO','in_progress','critical','task','task-stage-week-01-005',date '2026-07-29','{}'),
  ('stage-week-01','Captação','Adaptar plano de patrocínio de São Pedro para São Francisco e definir prazo máximo para inclusão de marcas.','Comercial + Mkt','31/07','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-006',date '2026-07-31','{}'),
  ('stage-week-01','Institucional','Confirmar agenda com Administração, ICMBio, Paróquia, associação local e operador técnico.','Guga','31/07','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-007',date '2026-07-31','{}'),
  ('stage-week-01','Autorizações','Criar checklist documental: percurso, uso de área, som, montagem, saúde, seguro, imagem e meio ambiente.','Operações','01/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-008',date '2026-08-01','{}'),
  ('stage-week-01','Percurso','Listar 2 alternativas de percurso e requisitos de cada uma; priorizar segurança e simplicidade operacional.','Dir. Técnico','01/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-01-009',date '2026-08-01','{}'),
  ('stage-week-01','Operação','Confirmar disponibilidade e interesse dos fornecedores/operadores utilizados em São Pedro.','Produção','01/08','VALIDAR','CRÍTICO','waiting_external','critical','task','task-stage-week-01-010',date '2026-08-01','{}'),
  ('stage-week-01','Marketing','Entregar briefing único: narrativa franciscana, paleta terrosa, Morro Dois Irmãos, público e chamada de inscrição.','Coord. + Mkt','30/07','EM CURSO','ALTO','in_progress','high','task','task-stage-week-01-011',date '2026-07-30','{}'),
  ('stage-week-01','Controle','Abrir planilha-mãe e reunião de 20 minutos, 3 vezes por semana, com semáforo de pendências.','PMO','28/07','PENDENTE','ALTO','not_started','high','task','task-stage-week-01-012',date '2026-07-28','{}'),
  ('stage-week-02','Visita técnica','Realizar visita in loco ou força-tarefa remota com vídeos, mapas e responsáveis locais.','Guga + Técnico','05/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-001',date '2026-08-05','{}'),
  ('stage-week-02','Percurso','Medir e registrar distância, altimetria, piso, cruzamentos, pontos de risco, evacuação e capacidade.','Dir. Técnico','06/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-002',date '2026-08-06','{}'),
  ('stage-week-02','Segurança','Definir tempo de corte, pontos de controle, varredura, acessos de ambulância e rota de retirada.','Técnico + Médico','07/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-003',date '2026-08-07','{}'),
  ('stage-week-02','Administração','Confirmar uso de áreas públicas, apoio logístico, trânsito, limpeza, tendas e estruturas disponíveis.','Guga','05/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-004',date '2026-08-05','{}'),
  ('stage-week-02','ICMBio','Validar impactos, sinalização, limites ambientais, manejo de resíduos e áreas sensíveis.','Guga + ICMBio','06/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-005',date '2026-08-06','{}'),
  ('stage-week-02','Paróquia','Definir participação pastoral, bênção, linguagem e compatibilidade com a agenda local.','Guga + Pároco','06/08','VALIDAR','ALTO','waiting_external','high','task','task-stage-week-02-006',date '2026-08-06','{}'),
  ('stage-week-02','Comunidade','Alinhar associação de atletas, voluntários, moradores e possíveis embaixadores locais.','Coord. Local','07/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-02-007',date '2026-08-07','{}'),
  ('stage-week-02','Operação','Escolher operador técnico e confirmar escopo: cronometragem, montagem, equipe, entrega e desmontagem.','Coord. Geral','07/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-008',date '2026-08-07','{}'),
  ('stage-week-02','Jurídico','Abrir cotação de seguro RC, acidentes pessoais e coberturas exigidas.','Jurídico','07/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-02-009',date '2026-08-07','{}'),
  ('stage-week-02','Produção','Definir conceito e fornecedores de camisa, número, medalha, troféu, sinalização e brindes.','Produção + Design','08/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-02-010',date '2026-08-08','{}'),
  ('stage-week-02','Identidade','Fechar logo, paleta, tipografia, aplicações e regras de convivência com patrocinadores.','Marketing','08/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-02-011',date '2026-08-08','{}'),
  ('stage-week-02','Checkpoint','GATE 1: congelar escopo, percurso-base, capacidade, orçamento e operador.','Núcleo Executivo','09/08','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-02-012',date '2026-08-09','{}'),
  ('stage-week-03','Regulamento','Adaptar e revisar regulamento: categorias, idade, percurso, corte, premiação, cancelamento e imagem.','Técnico + Jurídico','12/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-001',date '2026-08-12','{}'),
  ('stage-week-03','Inscrições','Configurar plataforma, lotes, capacidade, códigos, categorias, termos, waiver e política de reembolso.','Coord. + TI','13/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-002',date '2026-08-13','{}'),
  ('stage-week-03','Inclusão local','Definir política para ilhéus: preço, gratuidades, comprovação e limite de vagas.','Coord. Geral','12/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-003',date '2026-08-12','{}'),
  ('stage-week-03','LGPD','Revisar consentimentos de comunicação, imagem, dados de emergência e compartilhamento com cronometragem.','Jurídico + TI','13/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-03-004',date '2026-08-13','{}'),
  ('stage-week-03','Site','Publicar landing page com propósito, percurso preliminar, FAQ, inscrição, parceiros e contato.','Marketing + TI','14/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-005',date '2026-08-14','{}'),
  ('stage-week-03','Marketing','Produzir kit de lançamento: feed, stories, vídeo curto, release, WhatsApp e peças para parceiros.','Marketing','14/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-006',date '2026-08-14','{}'),
  ('stage-week-03','Lançamento','Abrir inscrições e publicar campanha oficial em todos os canais.','Coord. + Mkt','17/08','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-03-007',date '2026-08-17','{}'),
  ('stage-week-03','Imprensa','Distribuir release com foco em São Francisco, Noronha, esporte, propósito e legado local.','Assessoria','17/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-03-008',date '2026-08-17','{}'),
  ('stage-week-03','Trade','Fechar rede inicial de pousadas, receptivos, restaurantes e parceiros de divulgação.','Comercial Local','16/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-03-009',date '2026-08-16','{}'),
  ('stage-week-03','Produção','Receber no mínimo 3 cotações para itens críticos e comparar prazo, frete, qualidade e contingência.','Produção','14/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-010',date '2026-08-14','{}'),
  ('stage-week-03','Voluntários','Abrir pré-cadastro local e mapear funções, disponibilidade e necessidade de alimentação/transporte.','Coord. Local','16/08','PENDENTE','MÉDIO','not_started','medium','task','task-stage-week-03-011',date '2026-08-16','{}'),
  ('stage-week-03','Checkpoint','Testar inscrição completa em celular, confirmação por e-mail, cupom e exportação da base.','TI + Coord.','16/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-03-012',date '2026-08-16','{}'),
  ('stage-week-04','Inscrições','Acompanhar diariamente volume, origem, perfil, tamanho de camisa e abandono de checkout.','Coord. + Mkt','Diário','EM CURSO','CRÍTICO','in_progress','critical','task','task-stage-week-04-001',null,'{}'),
  ('stage-week-04','Marketing','Executar campanha de abertura por 7 dias com mídia paga, grupos de corrida, parceiros e ilhéus.','Marketing','23/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-002',date '2026-08-23','{}'),
  ('stage-week-04','Captação','Rodada intensiva de reuniões e follow-up; registrar proposta, objeção, valor e data de decisão.','Comercial','23/08','EM CURSO','CRÍTICO','in_progress','critical','task','task-stage-week-04-003',date '2026-08-23','{}'),
  ('stage-week-04','Produção','Selecionar fornecedores e formalizar condições, prazos, amostras, multas e logística para Noronha.','Produção','21/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-004',date '2026-08-21','{}'),
  ('stage-week-04','Patrocínio','Definir corte 1 de marcas para camisa e materiais de longa produção.','Comercial + Design','21/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-005',date '2026-08-21','{}'),
  ('stage-week-04','Camisas','Projetar quantidades por tamanho com margem técnica; evitar produção integral sem base de dados.','Coord. Kits','22/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-04-006',date '2026-08-22','{}'),
  ('stage-week-04','Medalhas','Aprovar desenho, material, peso, embalagem e texto da medalha e dos troféus.','Design + Produção','22/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-04-007',date '2026-08-22','{}'),
  ('stage-week-04','Autorizações','Protocolar pedidos formais e reunir comprovantes em pasta única.','Operações','21/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-008',date '2026-08-21','{}'),
  ('stage-week-04','Saúde','Fechar plano médico preliminar: equipe, ambulância, posto, remoção, hospital e contatos.','Coord. Médica','22/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-009',date '2026-08-22','{}'),
  ('stage-week-04','Operação','Contratar cronometragem, fotógrafo, filmmaker, som e itens não cobertos pelo operador.','Produção','23/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-04-010',date '2026-08-23','{}'),
  ('stage-week-04','Logística','Reservar blocos de viagem e hospedagem da equipe essencial antes da alta de preços.','Operações','21/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-011',date '2026-08-21','{}'),
  ('stage-week-04','Financeiro','Revisar caixa real versus compromissos; acionar orçamento mínimo se captação estiver atrasada.','Financeiro','23/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-04-012',date '2026-08-23','{}'),
  ('stage-week-05','Kits','Emitir pedido de camisas e definir datas de prova de cor, amostra, produção e entrega.','Produção','26/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-001',date '2026-08-26','{}'),
  ('stage-week-05','Medalhas','Contratar medalhas e troféus; registrar desenho aprovado e data de entrega segura.','Produção','26/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-002',date '2026-08-26','{}'),
  ('stage-week-05','Gráfica','Contratar números de peito, adesivos, backdrops, banners, placas e materiais de kit.','Produção','28/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-003',date '2026-08-28','{}'),
  ('stage-week-05','Estrutura','Fechar pórtico, grades, tendas, palco/pódio, som, energia, iluminação e mobiliário.','Operações','28/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-004',date '2026-08-28','{}'),
  ('stage-week-05','Percurso','Homologar traçado final e produzir mapa técnico com quilometragem e pontos de apoio.','Dir. Técnico','28/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-005',date '2026-08-28','{}'),
  ('stage-week-05','Segurança','Criar mapa de risco, cruzamentos, staff, cones, fitas, placas, rádio e responsáveis.','Técnico + Segurança','29/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-006',date '2026-08-29','{}'),
  ('stage-week-05','Hidratação','Definir cálculo de água, copos, gelo, transporte, reposição e descarte.','Operações','29/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-05-007',date '2026-08-29','{}'),
  ('stage-week-05','Sanitários','Confirmar banheiros, limpeza, iluminação e acessibilidade da área-base.','Produção Local','29/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-05-008',date '2026-08-29','{}'),
  ('stage-week-05','Ambiental','Fechar plano de resíduos, redução de descartáveis, desmontagem e recuperação das áreas.','Sustentabilidade','30/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-05-009',date '2026-08-30','{}'),
  ('stage-week-05','Seguro','Emitir apólice ou obter proposta final com requisitos para emissão.','Jurídico','30/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-010',date '2026-08-30','{}'),
  ('stage-week-05','Voluntários','Abrir convocação definitiva e selecionar líderes de área.','Coord. Local','30/08','PENDENTE','ALTO','not_started','high','task','task-stage-week-05-011',date '2026-08-30','{}'),
  ('stage-week-05','Operações','Publicar Plano de Operações v1: mapa, fluxos, cronograma e necessidades.','Dir. Operações','30/08','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-05-012',date '2026-08-30','{}'),
  ('stage-week-05','Go/No-Go','GATE 2 — GO/NO-GO EXECUTIVO: caixa mínimo assegurado, produção crítica contratada, autorizações protocoladas, seguro viável, percurso e operação confirmados.','Núcleo Executivo','30/08','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-05-013',date '2026-08-30','{}'),
  ('stage-week-06','Contratos','Organizar contratos, ordens de compra, dados bancários, notas fiscais e cronograma de pagamentos.','Financeiro + Jurídico','03/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-001',date '2026-09-03','{}'),
  ('stage-week-06','Logística','Criar plano de carga em duas levas: volumes, peso, responsável, voo, armazenamento e plano B.','Operações','04/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-002',date '2026-09-04','{}'),
  ('stage-week-06','Equipe','Fechar lista de viagem, hospedagem, transporte local, alimentação e horários de cada profissional.','Produção','04/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-003',date '2026-09-04','{}'),
  ('stage-week-06','Inventário','Criar inventário-mestre por caixa e etiqueta; nenhum item viaja sem registro.','Almoxarifado','05/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-06-004',date '2026-09-05','{}'),
  ('stage-week-06','Comunicação','Definir rádios, grupos de WhatsApp, canal de comando, nomenclaturas e árvore de escalonamento.','Dir. Operações','05/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-005',date '2026-09-05','{}'),
  ('stage-week-06','Emergência','Consolidar plano de emergência com contatos, papéis, evacuação, clima e interrupção da prova.','Médico + Técnico','05/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-006',date '2026-09-05','{}'),
  ('stage-week-06','Ambiental','Validar sinalização removível, descarte, limpeza e restrições com equipe local/ICMBio.','Sustentabilidade','05/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-06-007',date '2026-09-05','{}'),
  ('stage-week-06','Acessibilidade','Revisar acesso à arena, comunicação, atendimento prioritário e apoio a participantes.','Produção','05/09','PENDENTE','MÉDIO','not_started','medium','task','task-stage-week-06-008',date '2026-09-05','{}'),
  ('stage-week-06','Atletas','Redigir Guia do Atleta v1 com programação, regras, percurso, retirada, clima e recomendações.','Técnico + Mkt','06/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-06-009',date '2026-09-06','{}'),
  ('stage-week-06','Patrocínio','Montar matriz de contrapartidas por patrocinador, responsável, prazo e comprovação.','Comercial','06/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-010',date '2026-09-06','{}'),
  ('stage-week-06','Comunidade','Definir ação franciscana/ambiental simples, executável e conectada à ilha, sem criar risco ao Dia D.','Coord. Geral','06/09','PENDENTE','MÉDIO','not_started','medium','task','task-stage-week-06-011',date '2026-09-06','{}'),
  ('stage-week-06','Financeiro','Confirmar recursos recebidos e reservar caixa das despesas que não podem atrasar.','Financeiro','06/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-06-012',date '2026-09-06','{}'),
  ('stage-week-07','Marketing','Lançar campanha “30 dias” com calendário diário de propósito, percurso, kit, parceiros e serviço.','Marketing','11/09','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-07-001',date '2026-09-11','{}'),
  ('stage-week-07','Imprensa','Ativar imprensa esportiva, turismo, sustentabilidade e veículos locais com pauta e porta-vozes.','Assessoria','11/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-002',date '2026-09-11','{}'),
  ('stage-week-07','Comunidade','Selecionar embaixadores ilhéus e grupos de treino; entregar kit de divulgação.','Coord. Local','10/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-003',date '2026-09-10','{}'),
  ('stage-week-07','Mídia paga','Ajustar segmentação e verba com base no custo por inscrição e origem de conversão.','Marketing','13/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-004',date '2026-09-13','{}'),
  ('stage-week-07','Inscrições','Checkpoint: atingir 45%–50% da meta ou ativar plano de resgate comercial.','Coord. + Mkt','13/09','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-07-005',date '2026-09-13','{}'),
  ('stage-week-07','Produção','Receber e aprovar amostras físicas/digitais de camisa, medalha, número e materiais.','Produção + Design','11/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-07-006',date '2026-09-11','{}'),
  ('stage-week-07','Cronometragem','Testar importação da base, categorias, chips, resultados e contingência manual.','Técnico + TI','12/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-07-007',date '2026-09-12','{}'),
  ('stage-week-07','Sinalização','Fechar lista e layout de placas por ponto, setas, quilometragem, risco e hidratação.','Técnico + Design','12/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-008',date '2026-09-12','{}'),
  ('stage-week-07','Voluntários','Realizar briefing online inicial; confirmar líderes e substitutos.','Coord. Local','12/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-009',date '2026-09-12','{}'),
  ('stage-week-07','Percurso','Executar teste completo com equipe local e registrar tempo, comunicação e pontos críticos.','Dir. Técnico','13/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-07-010',date '2026-09-13','{}'),
  ('stage-week-07','Crise','Criar protocolo de resposta: acidente, cancelamento, atraso, crítica pública e informação incorreta.','Coord. + Mkt','13/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-07-011',date '2026-09-13','{}'),
  ('stage-week-07','Patrocinadores','Encerrar inclusão de marcas em itens de longa produção e colher aprovações formais.','Comercial','11/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-07-012',date '2026-09-11','{}'),
  ('stage-week-08','Produção','Acompanhar fabricação com evidência fotográfica, percentual concluído e data de expedição.','Produção','Contínuo','EM CURSO','CRÍTICO','in_progress','critical','task','task-stage-week-08-001',null,'{}'),
  ('stage-week-08','Inscrições','Higienizar base: duplicidades, documentação local, categorias, dados de emergência e tamanhos.','Coord. + TI','18/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-002',date '2026-09-18','{}'),
  ('stage-week-08','Cronometragem','Executar simulação de check-in, largada, leitura, chegada, resultado e premiação.','Técnico','19/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-003',date '2026-09-19','{}'),
  ('stage-week-08','Operações','Publicar Plano de Operações v2 com responsáveis nominais, horários e contatos.','Dir. Operações','20/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-004',date '2026-09-20','{}'),
  ('stage-week-08','Autorizações','Obter confirmações por escrito e arquivar ofícios, licenças, anuências e condicionantes.','Guga + Operações','20/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-005',date '2026-09-20','{}'),
  ('stage-week-08','Paróquia','Confirmar roteiro da bênção/participação, duração, local, som e responsável.','Coord. Pastoral','18/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-08-006',date '2026-09-18','{}'),
  ('stage-week-08','Foto/Vídeo','Fechar shot list: Morro Dois Irmãos, santo, largada, comunidade, patrocinadores e legado.','Filmmaker + Mkt','19/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-08-007',date '2026-09-19','{}'),
  ('stage-week-08','Premiação','Definir roteiro, categorias, autoridades, ordem, fala, trilha, pódio e contingência de resultados.','Cerimonial','19/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-08-008',date '2026-09-19','{}'),
  ('stage-week-08','Transporte','Mapear veículos locais para equipe, materiais, água, emergência e desmontagem.','Produção Local','20/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-009',date '2026-09-20','{}'),
  ('stage-week-08','Kits','Definir local, horários, layout, staff, filas, documentos e solução para terceiros.','Coord. Kits','20/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-08-010',date '2026-09-20','{}'),
  ('stage-week-08','Mídia','Criar credenciamento simples e regras de acesso a largada, percurso e chegada.','Assessoria','20/09','PENDENTE','MÉDIO','not_started','medium','task','task-stage-week-08-011',date '2026-09-20','{}'),
  ('stage-week-08','Checkpoint','Meta de inscritos: 60%–65%; revisar lote, verba, trade e convites institucionais.','Núcleo Executivo','20/09','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-08-012',date '2026-09-20','{}'),
  ('stage-week-09','Materiais','Receber no continente camisas, medalhas, números, placas, brindes e materiais de patrocinadores.','Produção','24/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-001',date '2026-09-24','{}'),
  ('stage-week-09','Qualidade','Conferir 100% dos itens críticos e amostragem dos demais; registrar faltas e defeitos.','Coord. Kits','25/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-002',date '2026-09-25','{}'),
  ('stage-week-09','Kits','Iniciar separação por tamanho/categoria e preparar envelopes de número e chip.','Coord. Kits','26/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-09-003',date '2026-09-26','{}'),
  ('stage-week-09','Carga 1','Enviar primeira leva: itens sem substituição local e estruturas com maior risco logístico.','Operações','27/09','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-09-004',date '2026-09-27','{}'),
  ('stage-week-09','Armazenamento','Confirmar recebimento, conferência e local seco/seguro em Noronha.','Coord. Local','27/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-005',date '2026-09-27','{}'),
  ('stage-week-09','Equipe','Fechar escala final de staff, líderes, turnos, alimentação e substitutos.','Dir. Operações','26/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-006',date '2026-09-26','{}'),
  ('stage-week-09','Voluntários','Publicar lista por função, ponto, horário e líder; confirmar presença individual.','Coord. Local','27/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-09-007',date '2026-09-27','{}'),
  ('stage-week-09','Saúde','Confirmar equipe médica, ambulância, materiais, rota e comunicação com unidade de saúde.','Coord. Médica','26/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-008',date '2026-09-26','{}'),
  ('stage-week-09','Percurso','Separar e etiquetar sinalização por setor; designar equipe de montagem e retirada.','Dir. Técnico','27/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-009',date '2026-09-27','{}'),
  ('stage-week-09','Clima','Definir critérios objetivos para adaptação, atraso, encurtamento ou cancelamento.','Técnico + Jurídico','27/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-010',date '2026-09-27','{}'),
  ('stage-week-09','Patrocínio','Cobrar parcelas finais e fechar briefing das ativações, brindes, convidados e exposição.','Comercial','25/09','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-09-011',date '2026-09-25','{}'),
  ('stage-week-09','Atletas','Enviar primeiro comunicado operacional e confirmar canais oficiais de informação.','Marketing','25/09','PENDENTE','ALTO','not_started','high','task','task-stage-week-09-012',date '2026-09-25','{}'),
  ('stage-week-09','Checkpoint','Meta de inscritos: 70%–75%; decidir lote final, cortes de custo e ações de última conversão.','Núcleo Executivo','27/09','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-09-013',date '2026-09-27','{}'),
  ('stage-week-10','Carga 2','Enviar segunda leva com reposições, materiais impressos finais e itens de menor risco.','Operações','01/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-001',date '2026-10-01','{}'),
  ('stage-week-10','Inventário','Conferir inventário continente x ilha e abrir lista de faltas com solução e responsável.','Almoxarifado','02/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-002',date '2026-10-02','{}'),
  ('stage-week-10','Guia do Atleta','Publicar versão final com horários, mapa, kit, clima, regras, segurança e contatos.','Técnico + Mkt','01/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-003',date '2026-10-01','{}'),
  ('stage-week-10','Comunicação','Enviar e-mail e WhatsApp de serviço; repetir mensagens essenciais em linguagem simples.','Marketing','02/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-10-004',date '2026-10-02','{}'),
  ('stage-week-10','Inscrições','Definir encerramento online em 08/10 ou antes por capacidade; bloquear mudanças que afetem produção.','Coord. + TI','02/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-005',date '2026-10-02','{}'),
  ('stage-week-10','Percurso','Fazer segundo teste integral, incluindo rádio, varredura, ambulância e tempo de corte.','Dir. Técnico','03/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-006',date '2026-10-03','{}'),
  ('stage-week-10','Montagem','Fechar mapa de arena, ordem de montagem, ferramentas, cargas elétricas e segurança.','Produção','03/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-007',date '2026-10-03','{}'),
  ('stage-week-10','Documentos','Montar pasta física e digital: licenças, apólices, contratos, mapas, contatos e listas.','PMO','03/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-008',date '2026-10-03','{}'),
  ('stage-week-10','Emergência','Realizar simulação de mesa com cenários de acidente, chuva, atraso e falha de cronometragem.','Dir. Operações','03/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-10-009',date '2026-10-03','{}'),
  ('stage-week-10','Imprensa','Distribuir release final e agenda de cobertura; confirmar entrevistas e porta-vozes.','Assessoria','02/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-10-010',date '2026-10-02','{}'),
  ('stage-week-10','Cobertura','Fechar pauta de stories, fotos, vídeos, marcas e entregas em tempo real.','Marketing','04/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-10-011',date '2026-10-04','{}'),
  ('stage-week-10','Kits','Treinar equipe de retirada e testar conferência, assinatura, chip e troca de tamanho.','Coord. Kits','04/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-10-012',date '2026-10-04','{}'),
  ('stage-week-10','Prontidão','GATE 5 — READINESS FINAL: confirmar autorizações, seguro, saúde, caixa, materiais, percurso, equipe e planos B; toda pendência deve ter contingência, responsável e prazo.','Núcleo Executivo','04/10','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-10-013',date '2026-10-04','{}'),
  ('stage-week-11','Viagem','Equipe essencial chega entre 06 e 07/10; evitar chegada de funções críticas na véspera.','Produção','07/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-001',date '2026-10-07','{}'),
  ('stage-week-11','Sala de situação','Ativar comando local diário às 08h e 18h, com registro de pendências e decisões.','Dir. Operações','07/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-002',date '2026-10-07','{}'),
  ('stage-week-11','Materiais','Conferir carga, kits, medalhas, chips, placas, rádios e ferramentas; separar caixa de contingência com baterias, fitas, água e reposições.','Almoxarifado','07/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-003',date '2026-10-07','{}'),
  ('stage-week-11','Montagem','Montar estruturas-base, energia, som, tendas, pódio, grades e sinalização de arena.','Produção','08–10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-004',null,'{}'),
  ('stage-week-11','Percurso','Marcar e revisar trajeto; fotografar cada ponto e registrar equipe responsável pela retirada.','Dir. Técnico','09–10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-005',null,'{}'),
  ('stage-week-11','Hidratação','Distribuir água, gelo, copos e recipientes; confirmar reposição e descarte.','Operações','10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-006',date '2026-10-10','{}'),
  ('stage-week-11','Saúde','Vistoriar ambulância, posto, materiais, acesso e comunicação; assinar briefing.','Coord. Médica','10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-007',date '2026-10-10','{}'),
  ('stage-week-11','Voluntários','Realizar briefing presencial, entregar identificação, alimentação e contatos.','Coord. Local','09/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-11-008',date '2026-10-09','{}'),
  ('stage-week-11','Kits','Entregar kits em 09 e 10/10; manter relatório de retirados, pendências e ocorrências.','Coord. Kits','09–10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-009',null,'{}'),
  ('stage-week-11','Inscrições','Fechar base, gerar listas, números, categorias e arquivos de cronometragem.','TI + Técnico','10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-010',date '2026-10-10','{}'),
  ('stage-week-11','Patrocinadores','Montar e fotografar ativações; conferir marcas com matriz de contrapartidas.','Comercial + Mkt','10/10','PENDENTE','ALTO','not_started','high','task','task-stage-week-11-011',date '2026-10-10','{}'),
  ('stage-week-11','Imprensa','Credenciar mídia, entregar mapa, horários, pontos de imagem e contatos.','Assessoria','10/10','PENDENTE','MÉDIO','not_started','medium','task','task-stage-week-11-012',date '2026-10-10','{}'),
  ('stage-week-11','Clima','Emitir boletim, decidir ajustes e comunicar somente pelos canais oficiais.','Dir. Operações','10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-013',date '2026-10-10','{}'),
  ('stage-week-11','Segurança','Fazer vistoria conjunta do percurso e arena com segurança, saúde e técnico.','Todos líderes','10/10','PENDENTE','CRÍTICO','not_started','critical','task','task-stage-week-11-014',date '2026-10-10','{}'),
  ('stage-week-11','Briefing final','Reunião de 30 minutos com líderes; cada área declara prontidão e plano B.','Coord. Geral','10/10','MARCO','CRÍTICO','not_started','critical','milestone','task-stage-week-11-015',date '2026-10-10','{}'),
  ('stage-event-day','Comando','Abertura da sala de situação; checagem de clima, comunicações, documentos e lista de líderes.','Dir. Operações','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-001',null,'{"time_label": "03h45"}'),
  ('stage-event-day','Arena / apoio','Energia, som, iluminação, tendas, banheiros, grades, pórtico e hidratação liberados.','Produção + Operações','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-002',null,'{"time_label": "04h00"}'),
  ('stage-event-day','Percurso','Equipes de setor iniciam varredura e confirmação fotográfica dos pontos.','Dir. Técnico','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-003',null,'{"time_label": "04h15"}'),
  ('stage-event-day','Saúde','Ambulância e equipe médica em posição; teste de rádio e rota de remoção.','Coord. Médica','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-004',null,'{"time_label": "04h30"}'),
  ('stage-event-day','Staff','Check-in de staff e voluntários; faltas substituídas imediatamente.','Coord. Local','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-005',null,'{"time_label": "05h00"}'),
  ('stage-event-day','Cronometragem','Teste final de chips, tapetes, relógio, sistema e contingência manual.','Cronometragem','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-006',null,'{"time_label": "05h10"}'),
  ('stage-event-day','Atletas / mídia','Abertura da arena, guarda-volumes e atendimento; início da cobertura institucional e de patrocinadores.','Kits + Marketing','DIA D','DIA D','ALTO','not_started','high','event_day','task-stage-event-day-007',null,'{"time_label": "05h20"}'),
  ('stage-event-day','Cerimonial / bênção','Chamada dos atletas, segurança, corte, comportamento ambiental e momento pastoral breve, previamente roteirizado.','Locução + Técnico + Paróquia','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-008',null,'{"time_label": "05h50"}'),
  ('stage-event-day','Largada','Organização dos pelotões/categorias e bloqueio de acesso à linha.','Técnico + Segurança','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-009',null,'{"time_label": "06h15"}'),
  ('stage-event-day','Prontidão','Líderes confirmam por rádio: percurso, saúde, hidratação, cronometragem e chegada.','Dir. Operações','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-010',null,'{"time_label": "06h25"}'),
  ('stage-event-day','Largada','LARGADA OFICIAL; registrar horário real e qualquer ocorrência.','TODOS','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-011',null,'{"time_label": "06h30"}'),
  ('stage-event-day','Varredura','Veículo/equipe de fechamento acompanha último atleta e comunica ocorrências.','Dir. Técnico','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-012',null,'{"time_label": "06h35"}'),
  ('stage-event-day','Percurso','Monitorar cruzamentos, hidratação, resíduos, público e atendimento; registrar incidentes.','Líderes de Setor','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-013',null,'{"time_label": "Durante"}'),
  ('stage-event-day','Resultado','Validar primeiros colocados, protestos, categorias e lista de premiação antes de anunciar.','Cronometragem + Técnico','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-014',null,'{"time_label": "Chegadas"}'),
  ('stage-event-day','Premiação','Executar roteiro objetivo, fotos oficiais, marcas, agradecimentos e legado comunitário.','Cerimonial','DIA D','DIA D','ALTO','not_started','high','event_day','task-stage-event-day-015',null,'{"time_label": "Pós-chegada"}'),
  ('stage-event-day','Desmobilização / debrief','Recolher sinalização e resíduos, liberar áreas após vistoria e realizar debrief rápido de incidentes, materiais, financeiro e mídia.','Operações + Coord. Geral','DIA D','DIA D','CRÍTICO','not_started','critical','event_day','task-stage-event-day-016',null,'{"time_label": "Após corte"}'),
  ('stage-post-event','Comunicação','Publicar resultados, fotos iniciais e agradecimento em até 24 horas.','Marketing','12/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-001',date '2026-10-12','{}'),
  ('stage-post-event','Atletas','Enviar resultado, certificado/link, pesquisa de satisfação e canal de ocorrências.','Coord. + TI','13/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-002',date '2026-10-13','{}'),
  ('stage-post-event','Imprensa','Distribuir release pós-evento com números, imagens, vencedores, parceiros e impacto.','Assessoria','13/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-003',date '2026-10-13','{}'),
  ('stage-post-event','Patrocínio','Enviar comprovação rápida de marca e mensagem de agradecimento individual.','Comercial','13/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-004',date '2026-10-13','{}'),
  ('stage-post-event','Incidentes','Consolidar relatório médico, segurança, protestos, danos e providências.','Dir. Operações','13/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-005',date '2026-10-13','{}'),
  ('stage-post-event','Financeiro','Fechar contas a pagar/receber, notas, adiantamentos, conciliação e fluxo real.','Financeiro','16/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-006',date '2026-10-16','{}'),
  ('stage-post-event','Inventário','Contar, fotografar, armazenar e registrar perdas, avarias e itens reaproveitáveis.','Almoxarifado','14/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-007',date '2026-10-14','{}'),
  ('stage-post-event','Contrapartidas','Montar relatório por patrocinador com fotos, links, métricas e entregas pendentes.','Comercial + Mkt','18/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-008',date '2026-10-18','{}'),
  ('stage-post-event','Comunidade','Agradecer formalmente Paróquia, órgãos, associações, voluntários e fornecedores locais.','Guga','15/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-009',date '2026-10-15','{}'),
  ('stage-post-event','Ambiental','Comprovar limpeza, resíduos, retirada de sinalização e recuperação das áreas.','Sustentabilidade','13/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-010',date '2026-10-13','{}'),
  ('stage-post-event','Lições aprendidas','Realizar reunião de 90 minutos: manter, corrigir, eliminar e criar para a próxima etapa.','Núcleo Executivo','16/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-011',date '2026-10-16','{}'),
  ('stage-post-event','Banco de dados','Higienizar base, registrar origem, consentimentos, comportamento e oportunidades futuras.','TI + Comercial','18/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-012',date '2026-10-18','{}'),
  ('stage-post-event','Legado','Publicar vídeo/álbum final e abrir narrativa para Santo Circuito 2027.','Marketing','18/10','PENDENTE','ALTO','not_started','high','post_event','task-stage-post-event-013',date '2026-10-18','{}'),
  ('stage-post-event','Arquivo','Salvar versão final de regulamentos, contratos, mapas, artes, listas e relatórios em pasta oficial.','PMO','18/10','PENDENTE','CRÍTICO','not_started','critical','post_event','task-stage-post-event-014',date '2026-10-18','{}')
)
insert into public.tasks(
  project_id,area_id,stage_id,title,task_type,status,priority,
  original_area_label,original_responsible_label,original_status_label,
  original_priority_label,original_due_date_label,due_date,source_key,
  source_section,metadata
)
select
  p.id,
  a.id,
  s.id,
  d.title,
  d.normalized_type::public.task_type,
  d.normalized_status::public.task_status,
  d.normalized_priority::public.task_priority,
  d.original_area_label,
  d.original_responsible_label,
  d.original_status_label,
  d.original_priority_label,
  d.original_due_date_label,
  d.due_date,
  d.source_key,
  case
    when d.stage_source_key='stage-event-day' then 'Dia D'
    when d.stage_source_key='stage-post-event' then 'Pós-evento'
    else 'Checklist semanal'
  end,
  d.metadata_text::jsonb
from p
join task_data d on true
join public.project_stages s on s.source_key=d.stage_source_key
left join public.areas a
  on a.project_id=p.id and a.name=d.original_area_label
where not exists (
  select 1
  from public.tasks existing
  where existing.project_id = p.id
    and existing.stage_id = s.id
    and existing.title = d.title
);

with p as (
  select id from public.projects where slug='cafifa-operacoes'
),
ev(name,description,sort_order,source_key) as (
  values
  ('01 · Governança', 'RACI, atas, cronograma, orçamento, decisões de Gate e lista de contatos.', 1, 'evidence-category-01'),
('02 · Autorizações', 'Ofícios, licenças, anuências, condicionantes, mapas e comprovantes de protocolo.', 2, 'evidence-category-02'),
('03 · Jurídico e seguro', 'Regulamento, termos, política de cancelamento, apólices, contratos e waivers.', 3, 'evidence-category-03'),
('04 · Financeiro', 'Orçamento aprovado, fluxo de caixa, contratos, pedidos, notas, pagamentos e prestação de contas.', 4, 'evidence-category-04'),
('05 · Patrocínio', 'Propostas, contratos, marcas aprovadas, matriz de contrapartidas e comprovações.', 5, 'evidence-category-05'),
('06 · Inscrições', 'Base, categorias, tamanhos, dados de emergência, consentimentos, relatórios e backups.', 6, 'evidence-category-06'),
('07 · Operações', 'Plano de Operações, mapas, escalas, inventário, transporte, alimentação e comunicação.', 7, 'evidence-category-07'),
('08 · Saúde e segurança', 'Plano de emergência, contatos, briefing, ambulância, equipe, ocorrências e relatório.', 8, 'evidence-category-08'),
('09 · Produção', 'Artes finais, provas, amostras, quantidades, fornecedores, expedição e conferência.', 9, 'evidence-category-09'),
('10 · Marketing', 'Briefings, peças finais, calendário, links, métricas, releases, fotos e vídeos.', 10, 'evidence-category-10'),
('11 · Ambiental', 'Plano de resíduos, materiais, condicionantes, limpeza e evidências pós-evento.', 11, 'evidence-category-11'),
('12 · Pós-evento', 'Resultados, pesquisas, incidentes, relatório de patrocinadores, financeiro e lições aprendidas.', 12, 'evidence-category-12')
)
insert into public.evidence_categories(project_id,name,description,sort_order,source_key)
select p.id,ev.name,ev.description,ev.sort_order,ev.source_key
from p cross join ev
where not exists (
  select 1
  from public.evidence_categories existing
  where existing.project_id = p.id
    and existing.name = ev.name
);

with p as (
  select id from public.projects where slug='cafifa-operacoes'
),
m(title,original_date_label,source_key) as (
  values
  ('Sala de situação aberta; captação e governança ativadas.', '28/07', 'milestone-01'),
('Equipe, RACI, orçamento mínimo e mapa de dependências definidos.', '02/08', 'milestone-02'),
('Escopo, percurso-base, operador técnico e conceito visual congelados.', '09/08', 'milestone-03'),
('Inscrições e campanha pública lançadas.', '17/08', 'milestone-04'),
('Go/No-Go executivo; caixa mínimo, operação, percurso, autorizações e produção crítica validados.', '30/08', 'milestone-05'),
('Campanha de 30 dias e checkpoint de conversão.', '11/09', 'milestone-06'),
('Primeira carga enviada e operação local fechada.', '27/09', 'milestone-07'),
('Readiness final e ativação de contingências; sem reabrir a decisão ordinária de realizar.', '04/10', 'milestone-08'),
('Equipe principal e materiais críticos em Noronha.', '07/10', 'milestone-09'),
('Entrega de kits, montagem, vistoria e briefing final.', '09–10/10', 'milestone-10'),
('DIA D — I Corrida de São Francisco · Etapa Noronha.', '11/10', 'milestone-11')
)
insert into public.project_milestones(
  project_id,title,original_date_label,priority,status,source_key
)
select p.id,m.title,m.original_date_label,'critical','not_started',m.source_key
from p cross join m
where not exists (
  select 1
  from public.project_milestones existing
  where existing.project_id = p.id
    and existing.title = m.title
);

do $$
declare
  target_project_id uuid;
  area_count integer;
  task_count integer;
  milestone_count integer;
  category_count integer;
begin
  select id into strict target_project_id
  from public.projects
  where slug = 'cafifa-operacoes';

  select count(*) into area_count
  from public.areas
  where project_id = target_project_id;

  select count(*) into task_count
  from public.tasks
  where project_id = target_project_id;

  select count(*) into milestone_count
  from public.project_milestones
  where project_id = target_project_id;

  select count(*) into category_count
  from public.evidence_categories
  where project_id = target_project_id;

  if area_count <> 88
     or task_count <> 168
     or milestone_count <> 11
     or category_count <> 12 then
    raise exception
      'Importação cancelada por contagem divergente: áreas=%, tarefas=%, marcos=%, categorias=%',
      area_count, task_count, milestone_count, category_count;
  end if;
end
$$;

commit;

-- CONFERÊNCIA
select
  (select count(*) from public.areas a where a.project_id = p.id) as total_areas,
  (select count(*) from public.tasks t where t.project_id = p.id) as total_tarefas,
  (select count(*) from public.project_milestones m where m.project_id = p.id) as total_marcos,
  (select count(*) from public.evidence_categories e where e.project_id = p.id) as total_categorias_evidencia
from public.projects p
where p.slug = 'cafifa-operacoes';

select s.name, count(t.id) as tarefas
from public.project_stages s
left join public.tasks t on t.stage_id=s.id
join public.projects p on p.id=s.project_id
where p.slug='cafifa-operacoes'
group by s.id,s.name,s.sort_order
order by s.sort_order;
