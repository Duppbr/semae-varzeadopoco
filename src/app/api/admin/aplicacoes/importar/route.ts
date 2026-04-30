import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// Função auxiliar para padronizar tipos (CONVENCIONAL → Convencional)
function normalizarTipo(tipo: string | null): string | null {
  if (!tipo) return null;
  const tp = tipo.trim().toUpperCase();
  if (tp === 'CONVENCIONAL') return 'Convencional';
  if (tp === 'AGM') return 'AGM';
  if (tp === 'EFB') return 'EFB';
  return tipo; // retorna original se não for reconhecido
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin')
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ erro: 'Arquivo não enviado' }, { status: 400 });

  const texto = await file.text();
  const parsed = Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ erro: 'Erro ao ler CSV', detalhes: parsed.errors }, { status: 400 });
  }

  const linhas = parsed.data as any[];
  let importadas = 0;
  const erros: string[] = [];

  for (const linha of linhas) {
    try {
      const id = linha.id?.trim();
      if (!id) continue;

      const amper = parseInt(linha.amper);
      const amperStr = isNaN(amper) ? null : `${amper}ah`;

      await prisma.aplicacaoVeiculo.upsert({
        where: { id },
        update: {
          battery: linha.battery || null,
          carBrand: linha.car_brand || null,
          carModel: linha.car_model || null,
          carYearFrom: linha.car_year_from ? parseInt(linha.car_year_from) : null,
          carYearTo: linha.car_year_to ? parseInt(linha.car_year_to) : null,
          vehicleType: linha.vehicle_type || null,
          amperagem: amperStr,
          tipo: normalizarTipo(linha.type), // <-- corrigido (update)
          garantia: linha.garantia || null,
          cca: linha.cca ? parseFloat(linha.cca) : null,
          length: linha.length ? parseFloat(linha.length) : null,
          width: linha.width ? parseFloat(linha.width) : null,
          height: linha.height ? parseFloat(linha.height) : null,
          weight: linha.weight ? parseFloat(linha.weight) : null,
          batteryAlt: linha.battery_alt || null,
          imageUrl: linha.image_url || null,
          complex: linha.complex === 'True',
        },
        create: {
          id,
          battery: linha.battery || null,
          carBrand: linha.car_brand || null,
          carModel: linha.car_model || null,
          carYearFrom: linha.car_year_from ? parseInt(linha.car_year_from) : null,
          carYearTo: linha.car_year_to ? parseInt(linha.car_year_to) : null,
          vehicleType: linha.vehicle_type || null,
          amperagem: amperStr,
          tipo: normalizarTipo(linha.type), // <-- corrigido (create)
          garantia: linha.garantia || null,
          cca: linha.cca ? parseFloat(linha.cca) : null,
          length: linha.length ? parseFloat(linha.length) : null,
          width: linha.width ? parseFloat(linha.width) : null,
          height: linha.height ? parseFloat(linha.height) : null,
          weight: linha.weight ? parseFloat(linha.weight) : null,
          batteryAlt: linha.battery_alt || null,
          imageUrl: linha.image_url || null,
          complex: linha.complex === 'True',
        },
      });
      importadas++;
    } catch (e: any) {
      erros.push(`Erro no id ${linha.id}: ${e.message}`);
    }
  }

  // Sincronizar amperagens como opções
  const amperagensUnicas = [...new Set(
    linhas
      .map(l => parseInt(l.amper))
      .filter(a => !isNaN(a))
  )];
  
  for (const amp of amperagensUnicas) {
    const valorAh = `${amp}ah`;
    await prisma.opcao.upsert({
      where: { categoria_valor: { categoria: 'amperagem', valor: valorAh } },
      update: {},
      create: { categoria: 'amperagem', valor: valorAh },
    });
  }

  // Sincronizar marcas de veículos como opções (categoria 'marca_veiculo')
  const marcasUnicas = [...new Set(linhas.map(l => l.car_brand?.trim()).filter(Boolean))];
  for (const marca of marcasUnicas) {
    await prisma.opcao.upsert({
      where: { categoria_valor: { categoria: 'marca_veiculo', valor: marca } },
      update: {},
      create: { categoria: 'marca_veiculo', valor: marca },
    });
  }

  return NextResponse.json({ message: `${importadas} aplicações importadas.`, erros });
}