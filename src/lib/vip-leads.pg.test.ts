import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

export function acharBin(
  env: NodeJS.ProcessEnv = process.env,
  base = "/usr/lib/postgresql",
): string | null {
  if (env.PG_BIN && existsSync(path.join(env.PG_BIN, "initdb"))) {
    return env.PG_BIN;
  }
  if (!existsSync(base)) return null;
  const versao = readdirSync(base)
    .sort((a, b) => Number(b) - Number(a) || b.localeCompare(a))
    .find((v) => existsSync(path.join(base, v, "bin", "initdb")));
  return versao ? path.join(base, versao, "bin") : null;
}

export function devePularPg(
  binPath: string | null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const emCI = Boolean(env.CI && env.CI !== "0" && env.CI !== "false");
  return !binPath && !emCI;
}

const bin = acharBin();
const raiz = path.resolve(__dirname, "../..");
const ADMIN_UID = "11111111-1111-4111-8111-111111111111";
const OUTRO_UID = "22222222-2222-4222-8222-222222222222";
const SEM_LINHA_UID = "99999999-9999-4999-8999-999999999999";
const ADMIN_EMAIL = "alandiogor@gmail.com";
const OUTRO_EMAIL = "outro@example.com";

type ResultadoPsql = ReturnType<typeof spawnSync> & {
  stdout: string;
  stderr: string;
};

type OpcoesAuth = {
  uid?: string;
  emailVerified?: boolean | null;
  isAnonymous?: boolean | null;
  extraClaims?: Record<string, unknown>;
};

describe("guarda de CI para binários do PostgreSQL", () => {
  test("não pula quando CI está setado mesmo sem binário (força falha no CI)", () => {
    expect(devePularPg(null, { NODE_ENV: "test", CI: "true" })).toBe(false);
    expect(devePularPg(null, { NODE_ENV: "test", CI: "1" })).toBe(false);
    expect(devePularPg(null, { NODE_ENV: "test" })).toBe(true);
    expect(devePularPg("/usr/lib/postgresql/17/bin", { NODE_ENV: "test" })).toBe(
      false,
    );
  });
});

describe.skipIf(devePularPg(bin))(
  "vip_leads — RLS, RPC e constraints em Postgres 17 real",
  () => {
    let dir = "";
    let porta = "";

    const psqlBase = () => [
      "-h",
      dir,
      "-p",
      porta,
      "-U",
      "postgres",
      "-X",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
      "-d",
      "postgres",
    ];

    const psql = (sql: string) =>
      spawnSync(path.join(bin!, "psql"), [...psqlBase(), "-At", "-c", sql], {
        encoding: "utf8",
      }) as ResultadoPsql;

    const comoAnon = (sql: string) =>
      psql(
        `begin; set local role anon; set local request.jwt.claim.role = 'anon'; set local request.jwt.claims = '{"role":"anon"}'; ${sql}; commit;`,
      );

    const comoAuth = (
      email: string,
      sql: string,
      opcoes: OpcoesAuth | string = {},
    ) => {
      const opts: OpcoesAuth =
        typeof opcoes === "string" ? { uid: opcoes } : opcoes;
      const uid = opts.uid ?? ADMIN_UID;
      const emailVerified =
        opts.emailVerified === undefined ? true : opts.emailVerified;
      const isAnonymous =
        opts.isAnonymous === undefined ? false : opts.isAnonymous;
      const claims: Record<string, unknown> = {
        sub: uid,
        email,
        role: "authenticated",
        ...(emailVerified !== null ? { email_verified: emailVerified } : {}),
        ...(isAnonymous !== null ? { is_anonymous: isAnonymous } : {}),
        ...(opts.extraClaims ?? {}),
      };
      const jsonClaims = JSON.stringify(claims).replace(/'/g, "''");
      return psql(
        `begin; set local role authenticated; set local request.jwt.claim.sub = '${uid}'; set local request.jwt.claim.role = 'authenticated'; set local request.jwt.claims = '${jsonClaims}'; ${sql}; commit;`,
      );
    };

    const ok = (r: ResultadoPsql) => {
      expect(r.status, r.stderr).toBe(0);
    };

    const negado = (r: ResultadoPsql, padrao: RegExp) => {
      expect(r.status).not.toBe(0);
      expect(r.stderr).toMatch(padrao);
    };

    const valor = (r: ResultadoPsql) => {
      ok(r);
      return r.stdout.trim();
    };

    beforeAll(() => {
      if (!bin) {
        throw new Error(
          "Binários do PostgreSQL (initdb/pg_ctl/psql) não encontrados no ambiente de CI.",
        );
      }
      dir = mkdtempSync(path.join(tmpdir(), "bcc-vip-leads-"));
      porta = String(50000 + Math.floor(Math.random() * 5000));
      execFileSync(
        path.join(bin, "initdb"),
        ["-D", path.join(dir, "data"), "-U", "postgres", "-A", "trust"],
        { stdio: "pipe" },
      );
      execFileSync(
        path.join(bin, "pg_ctl"),
        [
          "-D",
          path.join(dir, "data"),
          "-w",
          "-o",
          `-p ${porta} -k ${dir} -c listen_addresses=''`,
          "-l",
          path.join(dir, "log"),
          "start",
        ],
        { stdio: "pipe" },
      );

      const rodarArquivo = (arquivo: string) =>
        execFileSync(path.join(bin, "psql"), [...psqlBase(), "-f", arquivo], {
          stdio: "pipe",
        });

      rodarArquivo(path.join(raiz, "tests/sql/supabase-stub.sql"));
      const pastaMigrations = path.join(raiz, "supabase/migrations");
      const arquivos = readdirSync(pastaMigrations)
        .filter((nome) => nome.endsWith(".sql"))
        .sort();
      // Roda 2x para garantir idempotência das migrations
      for (const f of arquivos) {
        rodarArquivo(path.join(pastaMigrations, f));
      }
      for (const f of arquivos) {
        rodarArquivo(path.join(pastaMigrations, f));
      }

      // Popula auth.users com o admin confirmado e outro usuário autenticado
      ok(
        psql(`
          insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, is_anonymous)
          values
            ('${ADMIN_UID}', '${ADMIN_EMAIL}', now(), '{"email_verified":true}'::jsonb, '{"provider":"email"}'::jsonb, false),
            ('${OUTRO_UID}', '${OUTRO_EMAIL}', now(), '{}'::jsonb, '{"provider":"email"}'::jsonb, false)
          on conflict (id) do nothing;
        `),
      );
    });

    afterAll(() => {
      if (bin && dir) {
        spawnSync(path.join(bin, "pg_ctl"), [
          "-D",
          path.join(dir, "data"),
          "-m",
          "immediate",
          "stop",
        ]);
      }
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test("o Postgres local executando os testes está ativo (14+)", () => {
      expect(valor(psql("show server_version"))).toMatch(
        /^(1[4-9]|[2-9][0-9])\./,
      );
    });

    test("RLS enable + force ligada, índice único, is_vip_admin() sem claims/user_metadata e privilégios mínimos da tabela e funções", () => {
      expect(
        valor(
          psql(
            "select relrowsecurity::text || ':' || relforcerowsecurity::text from pg_class where oid = 'public.vip_leads'::regclass",
          ),
        ),
      ).toBe("true:true");

      expect(
        valor(
          psql(
            "select indisunique::text from pg_index where indexrelid = 'public.vip_leads_whatsapp_e164_key'::regclass",
          ),
        ),
      ).toBe("true");

      const policies = valor(
        psql(
          "select count(*) from pg_policies where schemaname = 'public' and tablename = 'vip_leads'",
        ),
      );
      expect(policies).toBe("4");

      const cmdsPolicies = valor(
        psql(
          "select string_agg(cmd || ':' || array_to_string(roles, ','), '|' order by cmd) from pg_policies where schemaname = 'public' and tablename = 'vip_leads'",
        ),
      );
      expect(cmdsPolicies).toBe(
        "DELETE:authenticated|INSERT:public|SELECT:authenticated|UPDATE:authenticated",
      );

      // As 3 policies de admin usam exclusivamente public.is_vip_admin()
      const policiesAdmin = valor(
        psql(
          "select count(*) from pg_policies where schemaname = 'public' and tablename = 'vip_leads' and cmd in ('SELECT', 'UPDATE', 'DELETE') and qual ~ 'is_vip_admin' and (cmd <> 'UPDATE' or with_check ~ 'is_vip_admin')",
        ),
      );
      expect(policiesAdmin).toBe("3");

      // Nenhuma policy pode usar user_metadata nem claims de e-mail/provider do JWT
      const usaClaimsOuUserMetadata = valor(
        psql(
          "select count(*) from pg_policies where schemaname = 'public' and tablename = 'vip_leads' and (coalesce(qual, '') ~* 'user_metadata|auth\\.jwt|email_verified|provider' or coalesce(with_check, '') ~* 'user_metadata|auth\\.jwt|email_verified|provider')",
        ),
      );
      expect(usaClaimsOuUserMetadata).toBe("0");

      // Metadados e privilégios de public.is_vip_admin()
      const ivaMeta = valor(
        psql(
          "select p.prosecdef::text || ':' || p.provolatile::text || ':' || l.lanname || ':' || pg_get_function_result(p.oid) || ':' || coalesce(array_to_string(p.proconfig, ';'), '') from pg_proc p join pg_language l on l.oid = p.prolang where p.oid = 'public.is_vip_admin()'::regprocedure",
        ),
      );
      expect(ivaMeta).toBe('true:s:sql:boolean:search_path=""');

      expect(
        valor(
          psql(
            "select has_function_privilege('anon', 'public.is_vip_admin()'::regprocedure, 'execute')::text || ':' || has_function_privilege('authenticated', 'public.is_vip_admin()'::regprocedure, 'execute')::text",
          ),
        ),
      ).toBe("false:true");

      const publicExecIva = valor(
        psql(
          "select exists(select 1 from aclexplode((select proacl from pg_proc where oid = 'public.is_vip_admin()'::regprocedure)) a where a.grantee = 0)::text",
        ),
      );
      expect(publicExecIva).toBe("false");

      // anon não executa public.is_vip_admin()
      negado(
        comoAnon("select public.is_vip_admin()"),
        /permission denied for function is_vip_admin/,
      );

      // anon não tem nenhum privilégio na tabela nem em colunas
      const privsTabelaAnon = valor(
        psql(
          "select coalesce(string_agg(privilege_type, ',' order by privilege_type), '') from information_schema.role_table_grants where table_schema = 'public' and table_name = 'vip_leads' and grantee = 'anon'",
        ),
      );
      expect(privsTabelaAnon).toBe("");

      const colsAnon = valor(
        psql(
          "select coalesce(string_agg(column_name || ':' || privilege_type, ',' order by column_name), '') from information_schema.column_privileges where table_schema = 'public' and table_name = 'vip_leads' and grantee = 'anon'",
        ),
      );
      expect(colsAnon).toBe("");

      for (const priv of ["INSERT", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        expect(
          valor(
            psql(
              `select has_table_privilege('authenticated', 'public.vip_leads', '${priv}')`,
            ),
          ),
        ).toBe("f");
      }

      // Exatamente UMA função em public executável por anon: vip_lead_signup
      const fnsAnon = valor(
        psql(
          "select string_agg(p.oid::regprocedure::text, '|') from pg_proc p where p.pronamespace = 'public'::regnamespace and has_function_privilege('anon', p.oid, 'execute')",
        ),
      );
      expect(fnsAnon).toBe(
        "vip_lead_signup(text,text,text,text,text,text)",
      );

      const rpcMeta = valor(
        psql(
          "select p.prosecdef::text || ':' || pg_get_function_result(p.oid) || ':' || coalesce(array_to_string(p.proconfig, ';'), '') from pg_proc p where p.oid = 'public.vip_lead_signup(text,text,text,text,text,text)'::regprocedure",
        ),
      );
      expect(rpcMeta).toBe("true:void:search_path=public, pg_temp");

      const publicExec = valor(
        psql(
          "select exists(select 1 from aclexplode((select proacl from pg_proc where oid = 'public.vip_lead_signup(text,text,text,text,text,text)'::regprocedure)) a where a.grantee = 0)::text",
        ),
      );
      expect(publicExec).toBe("false");
    });

    test("cadastro via RPC vip_lead_signup funciona e duplicado não vaza (devolve exatamente a mesma resposta e não muda a linha)", () => {
      const r1 = comoAnon(`
        select public.vip_lead_signup(
          'Maria Silva', '+5514998765432', 'bike', 'v1', 'placa', 'balcao'
        )
      `);
      ok(r1);

      const r2 = comoAnon(`
        select public.vip_lead_signup(
          'João Souza', '+551433812345', 'ambos', 'v1'
        )
      `);
      ok(r2);

      expect(valor(psql("select count(*) from public.vip_leads"))).toBe("2");

      const estadoAntes = valor(
        psql(
          "select id::text || '|' || nome || '|' || interesse || '|' || consent_at::text || '|' || consent_text_version || '|' || coalesce(utm_source, '') || '|' || coalesce(utm_campaign, '') || '|' || created_at::text from public.vip_leads where whatsapp_e164 = '+5514998765432'",
        ),
      );

      // 2ª chamada da RPC com mesmo número devolve exatamente a mesma resposta (void / sem id) e não muda a linha:
      const rDuplicado = comoAnon(`
        select public.vip_lead_signup(
          'Maria Tentando Sobrescrever', '+5514998765432', 'moto', 'v2', 'outro_src', 'outra_camp'
        )
      `);
      ok(rDuplicado);
      expect(rDuplicado.stdout).toBe(r1.stdout);
      expect(rDuplicado.stdout.trim()).toBe("");

      const estadoDepois = valor(
        psql(
          "select id::text || '|' || nome || '|' || interesse || '|' || consent_at::text || '|' || consent_text_version || '|' || coalesce(utm_source, '') || '|' || coalesce(utm_campaign, '') || '|' || created_at::text from public.vip_leads where whatsapp_e164 = '+5514998765432'",
        ),
      );
      expect(estadoDepois).toBe(estadoAntes);
      expect(valor(psql("select count(*) from public.vip_leads"))).toBe("2");
    });

    test("anon não faz INSERT direto na tabela nem SELECT, UPDATE ou DELETE (erro de permissão)", () => {
      negado(
        comoAnon(`
          insert into public.vip_leads (
            nome, whatsapp_e164, interesse, consent_text_version
          ) values (
            'Insert Direto Anon', '+5514991112222', 'moto', 'v1'
          )
        `),
        /permission denied for table vip_leads/,
      );

      negado(
        comoAnon(`
          insert into public.vip_leads (
            id, nome, whatsapp_e164, interesse, consent_at, consent_text_version
          ) values (
            '33333333-3333-4333-8333-333333333333', 'Teste ID', '+5514991112222', 'moto', now(), 'v1'
          )
        `),
        /permission denied for table vip_leads/,
      );

      negado(
        comoAnon("select * from public.vip_leads"),
        /permission denied for table vip_leads/,
      );

      // Mesmo se SELECT fosse concedido na tabela (em transação com rollback), RLS retorna 0 linhas para anon:
      expect(
        valor(
          psql(`
            begin;
            grant select on table public.vip_leads to anon;
            set local role anon;
            set local request.jwt.claims = '{"role":"anon"}';
            select count(*) from public.vip_leads;
            rollback;
          `),
        ),
      ).toBe("0");

      negado(
        comoAnon("update public.vip_leads set nome = 'Invadido'"),
        /permission denied for table vip_leads/,
      );
      negado(
        comoAnon("delete from public.vip_leads"),
        /permission denied for table vip_leads/,
      );
    });

    test("consent_at forjado é ignorado (RPC não aceita consent_at e INSERT direto grava sempre now())", () => {
      // 1) A RPC não possui parâmetro para consent_at: tentar passar um 7º argumento falha
      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'Forjado RPC', '+5514991113333', 'moto', 'v1', 'placa', 'balcao', '2000-01-01T00:00:00Z'::timestamptz
          )
        `),
        /function public\.vip_lead_signup\(.*\) does not exist/,
      );

      // 2) Ao cadastrar via RPC, consent_at gravado no banco é exatamente o now() da transação
      expect(
        valor(
          psql(`
            begin;
            set local role anon;
            set local request.jwt.claims = '{"role":"anon"}';
            select public.vip_lead_signup('Data Servidor RPC', '+5514991114444', 'bike', 'v1', null, null);
            reset role;
            select (consent_at = now() and created_at = now())::text
              from public.vip_leads
             where whatsapp_e164 = '+5514991114444';
            rollback;
          `),
        ),
      ).toContain("true");

      // 3) Mesmo em INSERT direto (ex.: service_role) tentando forjar consent_at no passado ou no futuro,
      // o trigger BEFORE INSERT ignora o valor forjado e grava exatamente now():
      expect(
        valor(
          psql(`
            begin;
            set local role service_role;
            insert into public.vip_leads (
              nome, whatsapp_e164, interesse, consent_at, consent_text_version, created_at
            ) values (
              'Forjado Passado', '+5514991115555', 'moto', '1999-01-01 00:00:00+00'::timestamptz, 'v1', '1999-01-01 00:00:00+00'::timestamptz
            );
            insert into public.vip_leads (
              nome, whatsapp_e164, interesse, consent_at, consent_text_version, created_at
            ) values (
              'Forjado Futuro', '+5514991116666', 'bike', now() + interval '365 days', 'v1', now() + interval '365 days'
            );
            select count(*)::text
              from public.vip_leads
             where whatsapp_e164 in ('+5514991115555', '+5514991116666')
               and consent_at = now()
               and created_at = now();
            rollback;
          `),
        ),
      ).toBe("2");
    });

    test("RPC vip_lead_signup e constraints rejeitam consent_text_version nulo/vazio e campos inválidos", () => {
      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'Sem Versao', '+5514991234567', 'moto', null
          )
        `),
        /Dados de cadastro inválidos/,
      );

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'Versao Vazia', '+5514991234567', 'moto', '   '
          )
        `),
        /Dados de cadastro inválidos/,
      );

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'Versao Longa', '+5514991234567', 'moto', repeat('v', 65)
          )
        `),
        /Dados de cadastro inválidos/,
      );

      for (const foneInvalido of [
        "14998765432",
        "+5504998765432",
        "+55149987654",
        "+55149987654321",
        "+15551234567",
        "+551499876543a",
      ]) {
        negado(
          comoAnon(`
            select public.vip_lead_signup(
              'Fone Invalido', '${foneInvalido}', 'moto', 'v1'
            )
          `),
          /Dados de cadastro inválidos/,
        );
      }

      for (const interesseInvalido of ["carro", "MOTO", "todos", ""]) {
        negado(
          comoAnon(`
            select public.vip_lead_signup(
              'Interesse Invalido', '+5514992223333', '${interesseInvalido}', 'v1'
            )
          `),
          /Dados de cadastro inválidos/,
        );
      }

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            '   ', '+5514992223333', 'moto', 'v1'
          )
        `),
        /Dados de cadastro inválidos/,
      );

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            repeat('A', 81), '+5514992223333', 'moto', 'v1'
          )
        `),
        /Dados de cadastro inválidos/,
      );

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'UTM Source Grande', '+5514992223333', 'moto', 'v1', repeat('s', 121), null
          )
        `),
        /Dados de cadastro inválidos/,
      );

      negado(
        comoAnon(`
          select public.vip_lead_signup(
            'UTM Campaign Grande', '+5514992223333', 'moto', 'v1', null, repeat('x', 121)
          )
        `),
        /Dados de cadastro inválidos/,
      );

      // Defesa em profundidade na tabela mesmo em service_role:
      negado(
        psql(`
          begin;
          set local role service_role;
          insert into public.vip_leads (
            nome, whatsapp_e164, interesse
          ) values (
            'Service Sem Versao', '+5514991234567', 'moto'
          );
          commit;
        `),
        /null value in column "consent_text_version" of relation "vip_leads" violates not-null constraint/,
      );
    });

    test("authenticated com outro e-mail não vê nada, não atualiza e não apaga", () => {
      expect(
        valor(
          comoAuth(OUTRO_EMAIL, "select count(*) from public.vip_leads", {
            uid: OUTRO_UID,
            emailVerified: true,
            isAnonymous: false,
          }),
        ),
      ).toBe("0");

      ok(
        comoAuth(
          OUTRO_EMAIL,
          "update public.vip_leads set nome = 'Alterado Indevido', opted_out_at = now()",
          { uid: OUTRO_UID, emailVerified: true, isAnonymous: false },
        ),
      );
      ok(
        comoAuth(OUTRO_EMAIL, "delete from public.vip_leads", {
          uid: OUTRO_UID,
          emailVerified: true,
          isAnonymous: false,
        }),
      );

      expect(
        valor(
          psql(
            "select count(*) from public.vip_leads where opted_out_at is null and nome in ('Maria Silva', 'João Souza')",
          ),
        ),
      ).toBe("2");
    });

    test("claim de e-mail forjado no JWT sem linha correspondente em auth.users (ou com outro uid) não vê, não atualiza e não apaga", () => {
      // 1) UID inexistente em auth.users tentando forjar email = alandiogor@gmail.com no JWT
      expect(
        valor(
          comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads", {
            uid: SEM_LINHA_UID,
            emailVerified: true,
            isAnonymous: false,
            extraClaims: {
              app_metadata: { provider: "email" },
              user_metadata: { email: ADMIN_EMAIL, email_verified: true },
            },
          }),
        ),
      ).toBe("0");

      ok(
        comoAuth(
          ADMIN_EMAIL,
          "update public.vip_leads set nome = 'Forjado Sem Linha', opted_out_at = now()",
          {
            uid: SEM_LINHA_UID,
            emailVerified: true,
            isAnonymous: false,
          },
        ),
      );
      ok(
        comoAuth(ADMIN_EMAIL, "delete from public.vip_leads", {
          uid: SEM_LINHA_UID,
          emailVerified: true,
          isAnonymous: false,
        }),
      );

      // 2) UID de outro usuário existente em auth.users tentando forjar email = alandiogor@gmail.com no JWT
      expect(
        valor(
          comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads", {
            uid: OUTRO_UID,
            emailVerified: true,
            isAnonymous: false,
            extraClaims: {
              app_metadata: { provider: "email" },
              user_metadata: { email: ADMIN_EMAIL, email_verified: true },
            },
          }),
        ),
      ).toBe("0");

      expect(
        valor(
          psql(
            "select count(*) from public.vip_leads where opted_out_at is null and nome in ('Maria Silva', 'João Souza')",
          ),
        ),
      ).toBe("2");
    });

    test("admin em auth.users com email_confirmed_at=null ou is_anonymous=true não vê nada, não atualiza e não apaga", () => {
      // 1) email_confirmed_at = null em auth.users (mesmo com claims email_verified=true e provider=email no JWT)
      ok(
        psql(
          `update auth.users set email_confirmed_at = null where id = '${ADMIN_UID}'`,
        ),
      );
      try {
        expect(
          valor(
            comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads", {
              uid: ADMIN_UID,
              emailVerified: true,
              isAnonymous: false,
              extraClaims: {
                app_metadata: { provider: "email" },
                user_metadata: { email: ADMIN_EMAIL, email_verified: true },
              },
            }),
          ),
        ).toBe("0");

        ok(
          comoAuth(
            ADMIN_EMAIL,
            "update public.vip_leads set opted_out_at = now()",
            { uid: ADMIN_UID, emailVerified: true, isAnonymous: false },
          ),
        );
        ok(
          comoAuth(ADMIN_EMAIL, "delete from public.vip_leads", {
            uid: ADMIN_UID,
            emailVerified: true,
            isAnonymous: false,
          }),
        );
      } finally {
        ok(
          psql(
            `update auth.users set email_confirmed_at = now() where id = '${ADMIN_UID}'`,
          ),
        );
      }

      // 2) is_anonymous = true em auth.users (mesmo com email_confirmed_at preenchido e claim is_anonymous=false no JWT)
      ok(
        psql(
          `update auth.users set is_anonymous = true where id = '${ADMIN_UID}'`,
        ),
      );
      try {
        expect(
          valor(
            comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads", {
              uid: ADMIN_UID,
              emailVerified: true,
              isAnonymous: false,
            }),
          ),
        ).toBe("0");

        ok(
          comoAuth(
            ADMIN_EMAIL,
            "update public.vip_leads set opted_out_at = now()",
            { uid: ADMIN_UID, emailVerified: true, isAnonymous: false },
          ),
        );
        ok(
          comoAuth(ADMIN_EMAIL, "delete from public.vip_leads", {
            uid: ADMIN_UID,
            emailVerified: true,
            isAnonymous: false,
          }),
        );
      } finally {
        ok(
          psql(
            `update auth.users set is_anonymous = false where id = '${ADMIN_UID}'`,
          ),
        );
      }

      expect(
        valor(
          psql(
            "select count(*) from public.vip_leads where opted_out_at is null and nome in ('Maria Silva', 'João Souza')",
          ),
        ),
      ).toBe("2");
    });

    test("admin confirmado em auth.users (alandiogor@gmail.com, email_confirmed_at is not null, is_anonymous=false) vê, atualiza, recadastro não limpa opted_out_at e apaga", () => {
      expect(
        valor(
          comoAuth(
            ADMIN_EMAIL,
            "select string_agg(nome, ',' order by nome) from public.vip_leads",
          ),
        ),
      ).toBe("João Souza,Maria Silva");

      ok(
        comoAuth(
          ADMIN_EMAIL,
          "update public.vip_leads set opted_out_at = now() where whatsapp_e164 = '+5514998765432'",
        ),
      );

      expect(
        valor(
          comoAuth(
            ADMIN_EMAIL,
            "select count(*) from public.vip_leads where opted_out_at is not null and whatsapp_e164 = '+5514998765432'",
          ),
        ),
      ).toBe("1");

      // Recadastro via RPC após opt-out NÃO limpa opted_out_at:
      ok(
        comoAnon(`
          select public.vip_lead_signup(
            'Maria Tentando Reativar', '+5514998765432', 'bike', 'v1'
          )
        `),
      );

      expect(
        valor(
          comoAuth(
            ADMIN_EMAIL,
            "select count(*) from public.vip_leads where opted_out_at is not null and whatsapp_e164 = '+5514998765432'",
          ),
        ),
      ).toBe("1");

      ok(
        comoAuth(
          ADMIN_EMAIL,
          "delete from public.vip_leads where whatsapp_e164 = '+551433812345'",
        ),
      );

      expect(
        valor(comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads")),
      ).toBe("1");
    });

    test("RPC vip_lead_signup e is_vip_admin com dono não-superuser e sem BYPASSRLS (vip_owner) funcionam sob FORCE RLS", () => {
      ok(
        psql(`
          do $$
          begin
            if not exists (select 1 from pg_roles where rolname = 'vip_owner') then
              create role vip_owner nologin nosuperuser nobypassrls;
            end if;
          end
          $$;
          grant usage, create on schema public to vip_owner;
          grant usage on schema auth to vip_owner;
          grant select on table auth.users to vip_owner;
          grant execute on all functions in schema auth to vip_owner;
          alter table public.vip_leads owner to vip_owner;
          alter function public.vip_lead_signup(text, text, text, text, text, text) owner to vip_owner;
          alter function public.is_vip_admin() owner to vip_owner;
          alter function public.vip_leads_force_consent_at() owner to vip_owner;
        `),
      );

      // Confirma que vip_owner não é superuser nem bypassrls e que tabela e funções pertencem a vip_owner com FORCE RLS ativa
      expect(
        valor(
          psql(
            "select rolsuper::text || ':' || rolbypassrls::text from pg_roles where rolname = 'vip_owner'",
          ),
        ),
      ).toBe("false:false");

      expect(
        valor(
          psql(
            "select pg_get_userbyid(relowner) || ':' || relrowsecurity::text || ':' || relforcerowsecurity::text from pg_class where oid = 'public.vip_leads'::regclass",
          ),
        ),
      ).toBe("vip_owner:true:true");

      expect(
        valor(
          psql(
            "select string_agg(p.proname || '=' || pg_get_userbyid(p.proowner), ',' order by p.proname) from pg_proc p where p.pronamespace = 'public'::regnamespace",
          ),
        ),
      ).toBe(
        "is_vip_admin=vip_owner,vip_lead_signup=vip_owner,vip_leads_force_consent_at=vip_owner",
      );

      // anon insere via RPC sob FORCE RLS mesmo com dono sem superuser/BYPASSRLS
      const rNovo = comoAnon(`
        select public.vip_lead_signup(
          'Carlos Sem Superuser', '+5514996660001', 'moto', 'v1', 'placa', 'balcao'
        )
      `);
      ok(rNovo);

      expect(
        valor(
          psql(
            "select count(*) || ':' || max(nome) from public.vip_leads where whatsapp_e164 = '+5514996660001'",
          ),
        ),
      ).toBe("1:Carlos Sem Superuser");

      // Chamada duplicada via RPC sob vip_owner continua não vazando erro nem sobrescrevendo
      const rDup = comoAnon(`
        select public.vip_lead_signup(
          'Carlos Duplicado', '+5514996660001', 'bike', 'v2'
        )
      `);
      ok(rDup);
      expect(rDup.stdout).toBe(rNovo.stdout);
      expect(
        valor(
          psql(
            "select count(*) || ':' || max(nome) from public.vip_leads where whatsapp_e164 = '+5514996660001'",
          ),
        ),
      ).toBe("1:Carlos Sem Superuser");

      // Mesmo se INSERT fosse concedido na tabela a anon ou authenticated (em transação com rollback), a policy de INSERT bloqueia
      negado(
        psql(`
          begin;
          grant insert on table public.vip_leads to anon;
          set local role anon;
          insert into public.vip_leads (nome, whatsapp_e164, interesse, consent_text_version)
          values ('Anon Direto Bloqueado', '+5514996660002', 'bike', 'v1');
          commit;
        `),
        /new row violates row-level security policy for table "vip_leads"/,
      );

      negado(
        psql(`
          begin;
          grant insert on table public.vip_leads to authenticated;
          set local role authenticated;
          set local request.jwt.claim.sub = '${ADMIN_UID}';
          insert into public.vip_leads (nome, whatsapp_e164, interesse, consent_text_version)
          values ('Auth Direto Bloqueado', '+5514996660003', 'bike', 'v1');
          commit;
        `),
        /new row violates row-level security policy for table "vip_leads"/,
      );

      // Admin confirmado continua lendo, atualizando e removendo normalmente
      expect(
        valor(comoAuth(ADMIN_EMAIL, "select count(*) from public.vip_leads")),
      ).toBe("2");

      expect(
        valor(
          comoAuth(OUTRO_EMAIL, "select count(*) from public.vip_leads", {
            uid: OUTRO_UID,
          }),
        ),
      ).toBe("0");
    });
  },
);
