import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

function acharBin(): string | null {
  if (process.env.PG_BIN !== undefined) {
    return process.env.PG_BIN &&
      existsSync(path.join(process.env.PG_BIN, "initdb"))
      ? process.env.PG_BIN
      : null;
  }
  const padrao = "/usr/lib/postgresql/17/bin";
  if (existsSync(path.join(padrao, "initdb"))) return padrao;
  const base = "/usr/lib/postgresql";
  if (!existsSync(base)) return null;
  const versao = readdirSync(base)
    .sort()
    .reverse()
    .find((v) => existsSync(path.join(base, v, "bin", "initdb")));
  return versao ? path.join(base, versao, "bin") : null;
}

const bin = acharBin();
const raiz = path.resolve(__dirname, "../..");
const ADMIN_UID = "11111111-1111-4111-8111-111111111111";
const OUTRO_UID = "22222222-2222-4222-8222-222222222222";
const ADMIN_EMAIL = "alandiogor@gmail.com";
const OUTRO_EMAIL = "outro@example.com";

type ResultadoPsql = ReturnType<typeof spawnSync> & {
  stdout: string;
  stderr: string;
};

describe.skipIf(!bin)("vip_leads — RLS e constraints em Postgres 17 real", () => {
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

  const comoAuth = (email: string, sql: string, uid = ADMIN_UID) =>
    psql(
      `begin; set local role authenticated; set local request.jwt.claim.sub = '${uid}'; set local request.jwt.claim.role = 'authenticated'; set local request.jwt.claims = '${JSON.stringify({ sub: uid, email, role: "authenticated" })}'; ${sql}; commit;`,
    );

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
    dir = mkdtempSync(path.join(tmpdir(), "bcc-vip-leads-"));
    porta = String(50000 + Math.floor(Math.random() * 5000));
    execFileSync(
      path.join(bin!, "initdb"),
      ["-D", path.join(dir, "data"), "-U", "postgres", "-A", "trust"],
      { stdio: "pipe" },
    );
    execFileSync(
      path.join(bin!, "pg_ctl"),
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
      execFileSync(path.join(bin!, "psql"), [...psqlBase(), "-f", arquivo], {
        stdio: "pipe",
      });

    rodarArquivo(path.join(raiz, "tests/sql/supabase-stub.sql"));
    const pastaMigrations = path.join(raiz, "supabase/migrations");
    for (const f of readdirSync(pastaMigrations)
      .filter((nome) => nome.endsWith(".sql"))
      .sort()) {
      rodarArquivo(path.join(pastaMigrations, f));
    }
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

  test("o Postgres local executando os testes é o 17", () => {
    expect(valor(psql("show server_version"))).toMatch(/^17\./);
  });

  test("RLS enable + force ligada, índice único em whatsapp_e164 e policies documentadas", () => {
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

    const selectRoles = valor(
      psql(
        "select array_to_string(roles, ',') from pg_policies where schemaname = 'public' and tablename = 'vip_leads' and cmd = 'SELECT'",
      ),
    );
    expect(selectRoles).toBe("authenticated");

    const privsTabelaAnon = valor(
      psql(
        "select coalesce(string_agg(privilege_type, ',' order by privilege_type), '') from information_schema.role_table_grants where table_schema = 'public' and table_name = 'vip_leads' and grantee = 'anon'",
      ),
    );
    expect(privsTabelaAnon).toBe("");

    const colsInsertAnon = valor(
      psql(
        "select coalesce(string_agg(column_name || ':' || privilege_type, ',' order by column_name), '') from information_schema.column_privileges where table_schema = 'public' and table_name = 'vip_leads' and grantee = 'anon'",
      ),
    );
    expect(colsInsertAnon).toBe(
      "consent_at:INSERT,consent_text_version:INSERT,interesse:INSERT,nome:INSERT,utm_campaign:INSERT,utm_source:INSERT,whatsapp_e164:INSERT",
    );

    for (const priv of ["TRUNCATE", "REFERENCES", "TRIGGER"]) {
      expect(
        valor(
          psql(
            `select has_table_privilege('authenticated', 'public.vip_leads', '${priv}')`,
          ),
        ),
      ).toBe("f");
    }
  });

  test("anon INSERT válido funciona e anon não pode setar id, created_at nem opted_out_at", () => {
    ok(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version, utm_source, utm_campaign
        ) values (
          'Maria Silva', '+5514998765432', 'bike', now(), 'v1', 'placa', 'balcao'
        )
      `),
    );

    ok(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          'João Souza', '+551433812345', 'ambos', now(), 'v1'
        )
      `),
    );

    expect(valor(psql("select count(*) from public.vip_leads"))).toBe("2");

    // Duplicidade em whatsapp_e164 deve falhar pelo índice único.
    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          'Maria Duplicada', '+5514998765432', 'moto', now(), 'v1'
        )
      `),
      /duplicate key value violates unique constraint "vip_leads_whatsapp_e164_key"/,
    );

    // anon não pode setar id, created_at nem opted_out_at.
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
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version, created_at
        ) values (
          'Teste Data', '+5514991112222', 'moto', now(), 'v1', now() - interval '10 days'
        )
      `),
      /permission denied for table vip_leads/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version, opted_out_at
        ) values (
          'Teste OptOut', '+5514991112222', 'moto', now(), 'v1', now()
        )
      `),
      /permission denied for table vip_leads/,
    );

    // Mesmo para authenticated (que tem INSERT na tabela), inserir já com opted_out_at preenchido falha na RLS.
    negado(
      comoAuth(
        ADMIN_EMAIL,
        `
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version, opted_out_at
        ) values (
          'Teste OptOut RLS', '+5514991112222', 'moto', now(), 'v1', now()
        )
      `,
      ),
      /new row violates row-level security policy for table "vip_leads"/,
    );
  });

  test("anon SELECT retorna erro de permissão e 0 linhas na camada de RLS", () => {
    // 1) Sem privilégio de SELECT, anon recebe erro imediato de permissão:
    negado(
      comoAnon("select * from public.vip_leads"),
      /permission denied for table vip_leads/,
    );

    // 2) Mesmo se o privilégio de SELECT existisse (testado em transação com rollback),
    // a ausência de policy SELECT para anon faz retornar 0 linhas:
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

    // E anon não pode atualizar nem apagar:
    negado(
      comoAnon("update public.vip_leads set nome = 'Invadido'"),
      /permission denied for table vip_leads/,
    );
    negado(
      comoAnon("delete from public.vip_leads"),
      /permission denied for table vip_leads/,
    );
  });

  test("anon INSERT sem consent_at ou sem consent_text_version falha na RLS (e no NOT NULL/CHECK mesmo em service_role)", () => {
    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_text_version
        ) values (
          'Sem Consent At', '+5514991234567', 'moto', 'v1'
        )
      `),
      /new row violates row-level security policy for table "vip_leads"/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          'Sem Consent At Null', '+5514991234567', 'moto', null, 'v1'
        )
      `),
      /new row violates row-level security policy for table "vip_leads"/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at
        ) values (
          'Sem Versao', '+5514991234567', 'moto', now()
        )
      `),
      /new row violates row-level security policy for table "vip_leads"/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          'Versao Vazia', '+5514991234567', 'moto', now(), '   '
        )
      `),
      /new row violates row-level security policy for table "vip_leads"/,
    );

    // Defesa em profundidade: mesmo em service_role (bypassrls), NOT NULL e CHECK bloqueiam:
    negado(
      psql(`
        begin;
        set local role service_role;
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_text_version
        ) values (
          'Service Sem Consent', '+5514991234567', 'moto', 'v1'
        );
        commit;
      `),
      /null value in column "consent_at" of relation "vip_leads" violates not-null constraint/,
    );

    negado(
      psql(`
        begin;
        set local role service_role;
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at
        ) values (
          'Service Sem Versao', '+5514991234567', 'moto', now()
        );
        commit;
      `),
      /null value in column "consent_text_version" of relation "vip_leads" violates not-null constraint/,
    );
  });

  test("anon INSERT com whatsapp_e164 inválido, interesse inválido ou nome/utm inválidos falha", () => {
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
          insert into public.vip_leads (
            nome, whatsapp_e164, interesse, consent_at, consent_text_version
          ) values (
            'Fone Invalido', '${foneInvalido}', 'moto', now(), 'v1'
          )
        `),
        /new row for relation "vip_leads" violates check constraint "vip_leads_whatsapp_e164_check"/,
      );
    }

    for (const interesseInvalido of ["carro", "MOTO", "todos", ""]) {
      negado(
        comoAnon(`
          insert into public.vip_leads (
            nome, whatsapp_e164, interesse, consent_at, consent_text_version
          ) values (
            'Interesse Invalido', '+5514992223333', '${interesseInvalido}', now(), 'v1'
          )
        `),
        /new row for relation "vip_leads" violates check constraint "vip_leads_interesse_check"/,
      );
    }

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          '   ', '+5514992223333', 'moto', now(), 'v1'
        )
      `),
      /new row for relation "vip_leads" violates check constraint "vip_leads_nome_check"/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version
        ) values (
          repeat('A', 81), '+5514992223333', 'moto', now(), 'v1'
        )
      `),
      /new row for relation "vip_leads" violates check constraint "vip_leads_nome_check"/,
    );

    negado(
      comoAnon(`
        insert into public.vip_leads (
          nome, whatsapp_e164, interesse, consent_at, consent_text_version, utm_campaign
        ) values (
          'UTM Grande', '+5514992223333', 'moto', now(), 'v1', repeat('x', 121)
        )
      `),
      /new row for relation "vip_leads" violates check constraint "vip_leads_utm_campaign_check"/,
    );
  });

  test("authenticated com outro email não vê nada, não atualiza e não apaga", () => {
    expect(
      valor(
        comoAuth(
          OUTRO_EMAIL,
          "select count(*) from public.vip_leads",
          OUTRO_UID,
        ),
      ),
    ).toBe("0");

    ok(
      comoAuth(
        OUTRO_EMAIL,
        "update public.vip_leads set nome = 'Alterado Indevido', opted_out_at = now()",
        OUTRO_UID,
      ),
    );
    ok(comoAuth(OUTRO_EMAIL, "delete from public.vip_leads", OUTRO_UID));

    // Confirma como superuser que nada foi alterado nem removido:
    expect(
      valor(
        psql(
          "select count(*) from public.vip_leads where opted_out_at is null and nome in ('Maria Silva', 'João Souza')",
        ),
      ),
    ).toBe("2");
  });

  test("authenticated com email admin (alandiogor@gmail.com) vê, atualiza e apaga", () => {
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
});
