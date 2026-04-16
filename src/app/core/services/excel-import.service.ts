import { Injectable, inject } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { SupabaseService } from './supabase.service';

export interface ImportRow {
  [key: string]: any;
}

export interface ExcelImportData {
  cursos: ImportRow[];
  modulos: ImportRow[];
  conteudos: ImportRow[];
  questoes: ImportRow[];
  turmas: ImportRow[];
  alunos: ImportRow[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ExcelImportService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  /** Lê o arquivo Excel e retorna os dados das abas como arrays de objetos */
  /** Lê o arquivo Excel e retorna os dados das abas como arrays de objetos */
  async parseFile(file: File): Promise<ExcelImportData> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const getSheetData = (sheetName: string): ImportRow[] => {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) return [];

      const data: ImportRow[] = [];
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.text.trim();
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const rowData: ImportRow = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let value = cell.value;
            
            // Basic sanitization for strings to prevent script injection
            if (typeof value === 'string') {
              value = value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                           .replace(/[<>]/g, (m) => ({ '<': '&lt;', '>': '&gt;' }[m as '<' | '>']));
            }

            rowData[header] = value;
            // Fallback for different naming conventions seen in the service
            const lowerHeader = header.toLowerCase();
            if (lowerHeader === 'titulo' || lowerHeader === 'título') rowData['titulo'] = value;
            if (lowerHeader === 'descrição' || lowerHeader === 'descricao') rowData['descricao'] = value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      });

      return data;
    };

    return {
      cursos: getSheetData('Cursos'),
      modulos: getSheetData('Modulos'),
      conteudos: getSheetData('Conteudos'),
      questoes: getSheetData('Questoes'),
      turmas: getSheetData('Turmas'),
      alunos: getSheetData('Alunos'),
    };
  }

  /** Importa os dados para o Supabase e retorna um log de resultados */
  async importData(
    data: ExcelImportData,
    onProgress?: (step: string, current: number, total: number) => void
  ): Promise<ImportResult[]> {
    const log: ImportResult[] = [];
    const steps = [
      { key: 'cursos',    label: 'Cursos',    count: data.cursos.length },
      { key: 'modulos',   label: 'Módulos',   count: data.modulos.length },
      { key: 'conteudos', label: 'Conteúdos', count: data.conteudos.length },
      { key: 'questoes',  label: 'Questões',  count: data.questoes.length },
      { key: 'turmas',    label: 'Turmas',    count: data.turmas.length },
      { key: 'alunos',    label: 'Alunos',    count: data.alunos.length },
    ];
    const totalItems = steps.reduce((s, x) => s + x.count, 0);
    let doneItems = 0;

    const emit = (label: string) => {
      onProgress?.(label, doneItems, totalItems);
    };

    log.push({
      success: true, type: 'info',
      message: `📦 Iniciando: ${data.cursos.length} cursos · ${data.modulos.length} módulos · ${data.conteudos.length} conteúdos · ${data.questoes.length} questões · ${data.turmas.length} turmas · ${data.alunos.length} alunos`
    });

    // Cache de áreas de conhecimento para não repetir queries
    const areaIdCache = new Map<string, string>();

    // ── 1. CURSOS ──────────────────────────────────────────────
    const courseIdMap = new Map<string, string>();
    emit('Importando Cursos...');

    // Batch insert: prepara todos os cursos válidos de uma vez
    const cursosValidos = data.cursos
      .map(row => ({
        titulo: String(row['titulo'] || row['Titulo'] || '').trim(),
        status: String(row['status'] || row['Status'] || 'Ativo').trim(),
      }))
      .filter(c => c.titulo);

    if (cursosValidos.length > 0) {
      const payload = cursosValidos.map(c => ({
        titulo: c.titulo,
        status: c.status === 'Inativo' ? 'Inativo' : 'Ativo',
      }));
      const { data: createdCursos, error: cursoErr } = await this.supabase
        .from('courses')
        .insert(payload)
        .select('id, titulo');

      if (cursoErr) {
        log.push({ success: false, type: 'error', message: `❌ Cursos: ${cursoErr.message}` });
      } else {
        for (const c of createdCursos || []) {
          courseIdMap.set(c.titulo.toLowerCase(), c.id);
          log.push({ success: true, type: 'success', message: `✅ Curso criado: "${c.titulo}"` });
        }
      }
    }
    doneItems += data.cursos.length;
    emit('Importando Módulos...');

    // ── 2. MÓDULOS / TÓPICOS ───────────────────────────────────────────────────
    // Mapa: "cursoLower|moduloLower" -> uuid do tópico
    const topicIdMap = new Map<string, string>();

    for (const row of data.modulos) {
      const cursoTitulo = String(row['curso_titulo'] || row['Curso'] || '').trim();
      const nomeModulo = String(row['nome_modulo'] || row['Modulo'] || row['Nome'] || '').trim();
      const ordem = parseInt(String(row['ordem'] || row['Ordem'] || '1'), 10) || 1;

      if (!nomeModulo) {
        log.push({ success: false, type: 'error', message: `❌ Módulo ignorado: nome vazio.` });
        continue;
      }

      // Procura o curso no mapa ou busca no banco (para cursos já existentes)
      let courseId = courseIdMap.get(cursoTitulo.toLowerCase());
      if (!courseId && cursoTitulo) {
        const { data: existing } = await this.supabase
          .from('courses')
          .select('id')
          .ilike('titulo', cursoTitulo)
          .maybeSingle();
        if (existing?.id) {
          courseId = existing.id;
          courseIdMap.set(cursoTitulo.toLowerCase(), existing.id);
        }
      }

      if (!courseId) {
        log.push({ success: false, type: 'warning', message: `⚠️ Módulo "${nomeModulo}": curso "${cursoTitulo}" não encontrado.` });
        continue;
      }

      const { data: newTopic, error } = await this.supabase
        .from('topics')
        .insert({ id_curso: courseId, nome_topico: nomeModulo, ordem })
        .select('id')
        .single();

      if (error) {
        log.push({ success: false, type: 'error', message: `❌ Módulo "${nomeModulo}": ${error.message} (código: ${error.code})` });
      } else {
        const topicKey = `${cursoTitulo.toLowerCase()}|${nomeModulo.toLowerCase()}`;
        topicIdMap.set(topicKey, newTopic.id);
        log.push({ success: true, type: 'success', message: `✅ Módulo criado: "${nomeModulo}" → "${cursoTitulo}"` });
      }
    }
    doneItems += data.modulos.length;
    emit('Importando Conteúdos...');

    // ── 3. CONTEÚDOS ───────────────────────────────────────────────────────────
    // Mapa: titulo_tema em lowercase -> uuid
    const contentIdMap = new Map<string, string>();

    for (const row of data.conteudos) {
      const titulo = String(row['titulo_tema'] || row['Titulo'] || row['titulo'] || '').trim();
      const descricao = String(row['descricao'] || row['Descricao'] || '').trim();
      const areaConhecimento = String(row['area_conhecimento'] || row['Area'] || '').trim();
      const conteudoHtml = String(row['conteudo_html'] || row['Conteudo'] || '').trim();

      // Campos opcionais para vincular ao módulo
      const cursoTitulo = String(row['curso_titulo'] || row['Curso'] || '').trim();
      const moduloNome = String(row['modulo'] || row['Modulo'] || '').trim();
      const ordemItem = parseInt(String(row['ordem_item'] || row['Ordem'] || '1'), 10) || 1;

      if (!titulo) {
        log.push({ success: false, type: 'error', message: `❌ Conteúdo ignorado: título vazio.` });
        continue;
      }

      // Resolução da área de conhecimento — busca ou cria automaticamente
      let areaId: string | null = null;
      if (areaConhecimento) {
        areaId = await this.getOrCreateArea(areaConhecimento, areaIdCache, log);
      }

      const { data: createdContent, error: contentError } = await this.supabase
        .from('contents')
        .insert({
          titulo_tema: titulo,
          descricao,
          conteudo_html: conteudoHtml || null,
          id_area_conhecimento: areaId,
          versao: 1,
          is_latest: true,
        })
        .select('id')
        .single();

      if (contentError) {
        log.push({ success: false, type: 'error', message: `❌ Conteúdo "${titulo}": ${contentError.message} (código: ${contentError.code})` });
        continue;
      }

      contentIdMap.set(titulo.toLowerCase(), createdContent.id);
      log.push({ success: true, type: 'success', message: `✅ Conteúdo criado: "${titulo}"` });

      // Vincular ao módulo se informado
      if (cursoTitulo && moduloNome) {
        const topicKey = `${cursoTitulo.toLowerCase()}|${moduloNome.toLowerCase()}`;
        let topicId = topicIdMap.get(topicKey);

        // Tenta buscar no banco se não estiver no mapa
        if (!topicId) {
          const courseId = courseIdMap.get(cursoTitulo.toLowerCase());
          if (courseId) {
            const { data: topicFound } = await this.supabase
              .from('topics')
              .select('id')
              .eq('id_curso', courseId)
              .ilike('nome_topico', moduloNome)
              .maybeSingle();
            if (topicFound?.id) {
              topicId = topicFound.id;
              topicIdMap.set(topicKey, topicFound.id);
            }
          }
        }

        if (topicId) {
          const { error: linkError } = await this.supabase
            .from('course_contents')
            .insert({ id_topico: topicId, id_conteudo: createdContent.id, tipo: 'conteudo', ordem: ordemItem });

          if (linkError) {
            log.push({ success: false, type: 'warning', message: `⚠️ Vínculo conteúdo→módulo "${titulo}": ${linkError.message}` });
          } else {
            log.push({ success: true, type: 'success', message: `🔗 "${titulo}" vinculado ao módulo "${moduloNome}"` });
          }
        } else {
          log.push({ success: false, type: 'warning', message: `⚠️ Módulo "${moduloNome}" não encontrado para vincular "${titulo}".` });
        }
      }
    }
    doneItems += data.conteudos.length;
    emit('Importando Questões...');

    // ── 4. QUESTÕES ────────────────────────────────────────────────────────────
    for (const row of data.questoes) {
      const enunciado = String(row['enunciado'] || row['Enunciado'] || '').trim();
      const titulo = String(row['titulo'] || row['Titulo'] || '').trim();
      const altA = String(row['alternativa_a'] || row['A'] || '').trim();
      const altB = String(row['alternativa_b'] || row['B'] || '').trim();
      const altC = String(row['alternativa_c'] || row['C'] || '').trim();
      const altD = String(row['alternativa_d'] || row['D'] || '').trim();
      const correta = String(row['correta'] || row['Correta'] || 'A').trim().toUpperCase();
      const areaConhecimento = String(row['area_conhecimento'] || row['Area'] || '').trim();
      const conteudoTitulo = String(row['conteudo'] || row['Conteudo'] || '').trim();
      const codigoQ = String(row['codigo'] || row['Codigo'] || row['Código'] || '').trim() || null;

      if (!enunciado) {
        log.push({ success: false, type: 'error', message: `❌ Questão ignorada: enunciado vazio.` });
        continue;
      }

      // Resolução da área — busca ou cria automaticamente
      let areaId: string | null = null;
      if (areaConhecimento) {
        areaId = await this.getOrCreateArea(areaConhecimento, areaIdCache, log);
      }

      // Resolução do conteúdo vinculado
      let conteudoId: string | null = null;
      if (conteudoTitulo) {
        // Primeiro verifica no mapa dos recém-criados
        conteudoId = contentIdMap.get(conteudoTitulo.toLowerCase()) || null;
        if (!conteudoId) {
          const { data: cont } = await this.supabase
            .from('contents')
            .select('id')
            .ilike('titulo_tema', conteudoTitulo)
            .eq('is_latest', true)
            .maybeSingle();
          conteudoId = cont?.id || null;
        }
        if (!conteudoId) {
          log.push({ success: false, type: 'warning', message: `⚠️ Conteúdo "${conteudoTitulo}" não encontrado — questão criada sem vínculo de conteúdo.` });
        }
      }

      // Cria a questão
      const { data: createdQ, error: qErr } = await this.supabase
        .from('questions')
        .insert({
          enunciado,
          titulo: titulo || enunciado.substring(0, 80),
          codigo: codigoQ,
          id_area_conhecimento: areaId,
          id_conteudo: conteudoId,
        })
        .select('id')
        .single();

      if (qErr) {
        log.push({ success: false, type: 'error', message: `❌ Questão "${enunciado.substring(0, 50)}": ${qErr.message} (código: ${qErr.code})` });
        continue;
      }

      // Cria as alternativas
      const altMap: Record<string, string> = { A: altA, B: altB, C: altC, D: altD };
      const altsPayload = ['A', 'B', 'C', 'D']
        .filter(l => altMap[l])
        .map(letra => ({
          id_questao: createdQ.id,
          texto: altMap[letra],
          is_correta: letra === correta,
        }));

      if (altsPayload.length > 0) {
        const { error: altErr } = await this.supabase.from('alternatives').insert(altsPayload);
        if (altErr) {
          log.push({ success: false, type: 'warning', message: `⚠️ Alternativas da questão "${enunciado.substring(0, 40)}": ${altErr.message}` });
        }
      } else {
        log.push({ success: false, type: 'warning', message: `⚠️ Questão "${enunciado.substring(0, 40)}": nenhuma alternativa encontrada.` });
      }

      log.push({ success: true, type: 'success', message: `✅ Questão criada: "${enunciado.substring(0, 60)}${enunciado.length > 60 ? '...' : ''}"` });
    }
    doneItems += data.questoes.length;
    emit('Importando Turmas...');

    // ── 5. TURMAS ──────────────────────────────────────────────────────────────
    // Mapa: nome_turma lowercase -> uuid
    const classIdMap = new Map<string, string>();

    for (const row of data.turmas) {
      const nomeTurma = String(row['nome_turma'] || row['Turma'] || row['Nome'] || '').trim();
      const cursoTitulo = String(row['curso_titulo'] || row['Curso'] || '').trim();

      if (!nomeTurma) {
        log.push({ success: false, type: 'error', message: `❌ Turma ignorada: nome vazio.` });
        continue;
      }

      // Verifica se já existe uma turma com esse nome
      const { data: existingClass } = await this.supabase
        .from('classes')
        .select('id')
        .ilike('nome_turma', nomeTurma)
        .maybeSingle();

      let classId: string;

      if (existingClass?.id) {
        classId = existingClass.id;
        classIdMap.set(nomeTurma.toLowerCase(), classId);
        log.push({ success: true, type: 'info', message: `ℹ️ Turma "${nomeTurma}" já existe — alunos serão matriculados nela.` });
      } else {
        const { data: newClass, error: classError } = await this.supabase
          .from('classes')
          .insert({ nome_turma: nomeTurma })
          .select('id')
          .single();

        if (classError) {
          log.push({ success: false, type: 'error', message: `❌ Turma "${nomeTurma}": ${classError.message}` });
          continue;
        }

        classId = newClass.id;
        classIdMap.set(nomeTurma.toLowerCase(), classId);
        log.push({ success: true, type: 'success', message: `✅ Turma criada: "${nomeTurma}"` });
      }

      // Vincular ao curso se informado
      if (cursoTitulo) {
        let courseId = courseIdMap.get(cursoTitulo.toLowerCase());
        if (!courseId) {
          const { data: existingCourse } = await this.supabase
            .from('courses')
            .select('id')
            .ilike('titulo', cursoTitulo)
            .maybeSingle();
          courseId = existingCourse?.id ?? undefined;
          if (courseId) courseIdMap.set(cursoTitulo.toLowerCase(), courseId);
        }

        if (courseId) {
          // Evita duplicar o vínculo
          const { data: existingLink } = await this.supabase
            .from('class_courses')
            .select('id')
            .eq('id_turma', classId)
            .eq('id_curso', courseId)
            .maybeSingle();

          if (!existingLink) {
            const { error: linkErr } = await this.supabase
              .from('class_courses')
              .insert({ id_turma: classId, id_curso: courseId });
            if (linkErr) {
              log.push({ success: false, type: 'warning', message: `⚠️ Vínculo turma→curso "${nomeTurma}→${cursoTitulo}": ${linkErr.message}` });
            } else {
              log.push({ success: true, type: 'success', message: `🔗 Turma "${nomeTurma}" vinculada ao curso "${cursoTitulo}"` });
            }
          }
        } else {
          log.push({ success: false, type: 'warning', message: `⚠️ Curso "${cursoTitulo}" não encontrado para vincular à turma "${nomeTurma}".` });
        }
      }
    }
    doneItems += data.turmas.length;
    emit('Importando Alunos...');

    // ── 6. ALUNOS ──────────────────────────────────────────────────────────────
    for (const row of data.alunos) {
      const nome = String(row['nome'] || row['Nome'] || '').trim();
      const email = String(row['email'] || row['Email'] || '').trim().toLowerCase();
      const nomeTurma = String(row['turma'] || row['Turma'] || '').trim();
      const senha = String(row['senha'] || row['Senha'] || '').trim() || this._gerarSenhaAleatoria();
      const cpf = String(row['cpf'] || row['CPF'] || '').trim();
      const telefone = String(row['telefone'] || row['Telefone'] || '').trim();
      const codigoAluno = String(row['codigo'] || row['Codigo'] || row['Código'] || row['Matricula'] || row['Matrícula'] || '').trim() || null;

      if (!nome || !email) {
        log.push({ success: false, type: 'error', message: `❌ Aluno ignorado: nome e e-mail são obrigatórios.` });
        continue;
      }

      // Verifica se o e-mail já está cadastrado
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let alunoId: string;

      if (existingProfile?.id) {
        alunoId = existingProfile.id;
        log.push({ success: true, type: 'info', message: `ℹ️ Aluno "${nome}" (${email}) já existe — apenas matriculando na turma.` });
      } else {
        // Cria o perfil do aluno (gera UUID pois a tabela não tem DEFAULT no campo id)
        const { data: newProfile, error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            codigo: codigoAluno,
            nome,
            email,
            senha,
            perfil: 'ALUNO',
            ativo: true,
            cpf: cpf || null,
            telefone: telefone || null,
          })
          .select('id')
          .single();

        if (profileError) {
          log.push({ success: false, type: 'error', message: `❌ Aluno "${nome}" (${email}): ${profileError.message}` });
          continue;
        }

        alunoId = newProfile.id;
        log.push({ success: true, type: 'success', message: `✅ Aluno criado: "${nome}" — login: ${email} (senha definida internamente)` });
      }

      // Matricular na turma se informado
      if (nomeTurma) {
        let classId = classIdMap.get(nomeTurma.toLowerCase());

        // Tenta encontrar no banco se não estiver no mapa desta importação
        if (!classId) {
          const { data: existingClass } = await this.supabase
            .from('classes')
            .select('id')
            .ilike('nome_turma', nomeTurma)
            .maybeSingle();
          if (existingClass?.id) {
            classId = existingClass.id as string;
            classIdMap.set(nomeTurma.toLowerCase(), classId);
          }
        }

        if (classId) {
          // Evita matrícula duplicada
          const { data: existingEnroll } = await this.supabase
            .from('class_students')
            .select('id')
            .eq('id_turma', classId)
            .eq('id_aluno', alunoId)
            .maybeSingle();

          if (!existingEnroll) {
            const { error: enrollError } = await this.supabase
              .from('class_students')
              .insert({ id_turma: classId, id_aluno: alunoId });
            if (enrollError) {
              log.push({ success: false, type: 'warning', message: `⚠️ Matrícula de "${nome}" na turma "${nomeTurma}": ${enrollError.message}` });
            } else {
              log.push({ success: true, type: 'success', message: `🎓 "${nome}" matriculado(a) na turma "${nomeTurma}"` });
            }
          } else {
            log.push({ success: true, type: 'info', message: `ℹ️ "${nome}" já estava matriculado(a) na turma "${nomeTurma}".` });
          }
        } else {
          log.push({ success: false, type: 'warning', message: `⚠️ Turma "${nomeTurma}" não encontrada para matricular "${nome}". Crie a turma na aba Turmas.` });
        }
      }
    }
    doneItems += data.alunos.length;
    emit('Concluído!');

    const totalItens = data.cursos.length + data.modulos.length + data.conteudos.length +
                       data.questoes.length + data.turmas.length + data.alunos.length;
    if (totalItens === 0) {
      log.push({ success: false, type: 'warning', message: '⚠️ Nenhum dado encontrado. Verifique os nomes das abas: Cursos, Modulos, Conteudos, Questoes, Turmas, Alunos.' });
    }

    return log;
  }

  /**
   * Busca uma área de conhecimento pelo nome; se não existir, cria automaticamente.
   * Usa um cache (areaIdCache) para evitar queries duplicadas na mesma importação.
   */
  private async getOrCreateArea(
    nomeArea: string,
    cache: Map<string, string>,
    log: ImportResult[]
  ): Promise<string | null> {
    const key = nomeArea.toLowerCase().trim();

    // 1. Verifica o cache local
    if (cache.has(key)) return cache.get(key)!;

    // 2. Busca no banco
    const { data: existing, error: searchError } = await this.supabase
      .from('knowledge_areas')
      .select('id')
      .ilike('area_conhecimento', nomeArea)
      .maybeSingle();

    if (searchError) {
      log.push({ success: false, type: 'warning', message: `⚠️ Erro ao buscar área "${nomeArea}": ${searchError.message}` });
      return null;
    }

    if (existing?.id) {
      cache.set(key, existing.id);
      return existing.id;
    }

    // 3. Não encontrou — cria a área automaticamente
    const { data: created, error: createError } = await this.supabase
      .from('knowledge_areas')
      .insert({
        area_conhecimento: nomeArea,
        permite_conteudo: true,
      })
      .select('id')
      .single();

    if (createError) {
      log.push({ success: false, type: 'warning', message: `⚠️ Não foi possível criar a área "${nomeArea}": ${createError.message}` });
      return null;
    }

    cache.set(key, created.id);
    log.push({ success: true, type: 'info', message: `🏷️ Área de conhecimento criada automaticamente: "${nomeArea}"` });
    return created.id;
  }

  /**
   * Gera uma senha aleatória para alunos sem senha definida no Excel.
   * Usa crypto.getRandomValues() — criptograficamente seguro.
   */
  private _gerarSenhaAleatoria(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map(b => chars[b % chars.length])
      .join('');
  }

  /** Gera e baixa uma planilha modelo com exemplos */
  /** Gera e baixa uma planilha modelo com exemplos */
  async downloadTemplate(): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // Helper para adicionar abas com dados
    const addSheet = (name: string, data: any[]) => {
      const sheet = workbook.addWorksheet(name);
      if (data.length > 0) {
        const columns = Object.keys(data[0]).map(key => ({ header: key, key }));
        sheet.columns = columns;
        sheet.addRows(data);
        sheet.getRow(1).font = { bold: true };
      }
    };

    // ── Aba Cursos ──────────────────────────────────────────────────────────
    addSheet('Cursos', [
      { titulo: 'Formação em IA Aplicada', status: 'Ativo' },
      { titulo: 'Marketing Digital Avançado', status: 'Ativo' },
    ]);

    // ── Aba Módulos ─────────────────────────────────────────────────────────
    addSheet('Modulos', [
      { curso_titulo: 'Formação em IA Aplicada', nome_modulo: 'Introdução à IA', ordem: 1 },
      { curso_titulo: 'Formação em IA Aplicada', nome_modulo: 'Machine Learning Básico', ordem: 2 },
      { curso_titulo: 'Marketing Digital Avançado', nome_modulo: 'SEO e SEM', ordem: 1 },
      { curso_titulo: 'Marketing Digital Avançado', nome_modulo: 'Mídias Sociais', ordem: 2 },
    ]);

    // ── Aba Conteúdos ───────────────────────────────────────────────────────
    addSheet('Conteudos', [
      {
        titulo_tema: 'O que é Inteligência Artificial?',
        descricao: 'Visão geral sobre IA e suas aplicações.',
        area_conhecimento: 'Tecnologia',
        conteudo_html: '<p>Conteúdo aqui (opcional)</p>',
        curso_titulo: 'Formação em IA Aplicada',
        modulo: 'Introdução à IA',
        ordem_item: 1,
      },
      {
        titulo_tema: 'Redes Neurais Artificiais',
        descricao: 'Como funcionam as redes neurais.',
        area_conhecimento: 'Tecnologia',
        conteudo_html: '',
        curso_titulo: 'Formação em IA Aplicada',
        modulo: 'Machine Learning Básico',
        ordem_item: 1,
      },
    ]);

    // ── Aba Questões ────────────────────────────────────────────────────────
    addSheet('Questoes', [
      {
        codigo: 'Q001',
        titulo: 'Linguagem mais usada em IA',
        enunciado: 'Qual linguagem de programação é mais usada em projetos de IA?',
        alternativa_a: 'Python',
        alternativa_b: 'COBOL',
        alternativa_c: 'Pascal',
        alternativa_d: 'Delphi',
        correta: 'A',
        area_conhecimento: 'Tecnologia',
        conteudo: 'O que é Inteligência Artificial?',
      },
      {
        codigo: 'Q002',
        titulo: 'Definição de Machine Learning',
        enunciado: 'O que é Machine Learning?',
        alternativa_a: 'Um subconjunto da IA que aprende com dados',
        alternativa_b: 'Um tipo de hardware',
        alternativa_c: 'Uma linguagem de programação',
        alternativa_d: 'Um banco de dados',
        correta: 'A',
        area_conhecimento: 'Tecnologia',
        conteudo: 'Redes Neurais Artificiais',
      },
    ]);

    // ── Aba Turmas ─────────────────────────────────────────────────────────────
    addSheet('Turmas', [
      { nome_turma: 'Turma IA 2025', curso_titulo: 'Formação em IA Aplicada' },
      { nome_turma: 'Turma Marketing 2025', curso_titulo: 'Marketing Digital Avançado' },
    ]);

    // ── Aba Alunos ─────────────────────────────────────────────────────────────
    addSheet('Alunos', [
      { codigo: 'MAT001', nome: 'Maria Silva', email: 'maria.silva@email.com', senha: 'Senha@123', turma: 'Turma IA 2025', cpf: '123.456.789-00', telefone: '(11) 99999-0001' },
      { codigo: 'MAT002', nome: 'João Oliveira', email: 'joao.oliveira@email.com', senha: 'Senha@456', turma: 'Turma IA 2025', cpf: '', telefone: '' },
      { codigo: '', nome: 'Ana Costa', email: 'ana.costa@email.com', senha: '', turma: 'Turma Marketing 2025', cpf: '', telefone: '' },
    ]);

    // Gera o buffer e dispara o download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
