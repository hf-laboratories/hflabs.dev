// src/utils/schemaCatalog.ts
import fs from 'node:fs';
import path from 'node:path';

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  desc: string;
  constraints?: string;
}

export interface SchemaItem {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: string;
  format: 'JSON Schema' | 'JSONL' | 'XML' | 'Protobuf' | 'JSON';
  formatBadge: string;
  version: string;
  downloadUrl: string;
  rawContent: string;
  fields: SchemaField[];
  samplePayload: any;
  propertyCount: number;
}

export function getAllSchemas(): SchemaItem[] {
  const schemasDir = path.resolve(process.cwd(), 'public', 'schemas');
  if (!fs.existsSync(schemasDir)) {
    return [];
  }

  const files = fs.readdirSync(schemasDir);
  const items: SchemaItem[] = [];

  for (const file of files) {
    const filePath = path.join(schemasDir, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const ext = path.extname(file).toLowerCase();
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const id = file.replace(/\./g, '-');

    let format: SchemaItem['format'] = 'JSON Schema';
    let formatBadge = 'JSON Schema';
    let title = file.replace(/(\.schema)?\.(json|jsonl|xml|proto)$/i, '').replace(/[-_]/g, ' ');
    // Capitalize words
    title = title.replace(/\b\w/g, l => l.toUpperCase());
    let description = 'System schema specification for HFLabs core runtime and microservices.';
    let category = 'General & Utility';
    let version = '1.0.0';
    let fields: SchemaField[] = [];
    let samplePayload: any = null;

    if (file.endsWith('.jsonl')) {
      format = 'JSONL';
      formatBadge = 'JSONL Stream';
      category = 'Streaming Telemetry (JSONL)';
      description = 'Line-delimited JSON stream records for real-time telemetry sidecars, metric tracing, and batch trials.';
      const lines = rawContent.trim().split('\n');
      try {
        const firstLine = JSON.parse(lines[0]);
        Object.keys(firstLine).forEach(key => {
          const val = firstLine[key];
          fields.push({
            name: key,
            type: typeof val,
            required: true,
            desc: `Sample value: ${JSON.stringify(val)}`
          });
        });
        samplePayload = firstLine;
      } catch (e) {
        samplePayload = { rawLines: lines.length };
      }
    } else if (file.endsWith('.xml') || file.endsWith('.xsd')) {
      format = 'XML';
      formatBadge = 'XML / XSD';
      category = 'XML & Data Contracts';
      description = 'Formal XML Schema Definition (XSD) and data layout contract for tooling, hardware models, and visual canvases.';
      samplePayload = "<XmlDataContract />";
    } else if (file.endsWith('.proto')) {
      format = 'Protobuf';
      formatBadge = 'Protobuf gRPC';
      category = 'Protobuf & gRPC';
      description = 'Protocol Buffer IDL defining gRPC service contracts, RPC interfaces, and binary wire message formats.';
      samplePayload = "// Protobuf v3 Wire Definition";
    } else if (file.endsWith('.json')) {
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed.title) title = parsed.title;
        if (parsed.description) description = parsed.description;
        if (parsed.$id && parsed.$id.includes('v')) {
          const vMatch = parsed.$id.match(/v(\d+(\.\d+)?)/);
          if (vMatch) version = vMatch[1];
        }

        const requiredList = Array.isArray(parsed.required) ? parsed.required : [];

        if (parsed.properties && typeof parsed.properties === 'object') {
          format = 'JSON Schema';
          formatBadge = 'JSON Schema Draft-07';
          const sample: Record<string, any> = {};

          Object.keys(parsed.properties).forEach(propName => {
            const prop = parsed.properties[propName];
            const isReq = requiredList.includes(propName);
            const pType = prop.type || (prop.enum ? 'enum' : (prop.oneOf ? 'oneOf' : (prop.$ref ? 'reference' : 'object')));
            let constraints = '';
            if (prop.minimum !== undefined) constraints += `min: ${prop.minimum} `;
            if (prop.maximum !== undefined) constraints += `max: ${prop.maximum} `;
            if (prop.enum) constraints += `enum: [${prop.enum.join(', ')}] `;
            if (prop.pattern) constraints += `pattern: ${prop.pattern}`;

            fields.push({
              name: propName,
              type: Array.isArray(pType) ? pType.join(' | ') : String(pType),
              required: isReq,
              desc: prop.description || 'Property specification',
              constraints: constraints.trim() || undefined
            });

            // Generate sample value
            if (prop.default !== undefined) sample[propName] = prop.default;
            else if (prop.example !== undefined) sample[propName] = prop.example;
            else if (prop.enum) sample[propName] = prop.enum[0];
            else if (pType === 'string') sample[propName] = propName.includes('time') ? new Date().toISOString() : `${propName}_val`;
            else if (pType === 'integer' || pType === 'number') sample[propName] = prop.minimum || 42;
            else if (pType === 'boolean') sample[propName] = true;
            else if (pType === 'array') sample[propName] = [];
            else sample[propName] = {};
          });

          samplePayload = sample;
        } else {
          format = 'JSON';
          formatBadge = 'JSON Data Contract';
          samplePayload = parsed;
        }
      } catch (e) {
        format = 'JSON';
        formatBadge = 'JSON';
      }
    }

    // Assign categories
    const lowerFile = file.toLowerCase();
    if (lowerFile.includes('gc2') || lowerFile.includes('ipu') || lowerFile.includes('poplar') || lowerFile.includes('mimd')) {
      category = 'Hardware & IPU Architecture';
    } else if (lowerFile.includes('accelerator') || lowerFile.includes('plan') || lowerFile.includes('pipeline') || lowerFile.includes('composer')) {
      category = 'Accelerator & Compute Plans';
    } else if (lowerFile.includes('swarm') || lowerFile.includes('benchmark') || lowerFile.includes('director') || lowerFile.includes('hypercache')) {
      category = 'Swarm & Optimization';
    } else if (lowerFile.includes('model') || lowerFile.includes('registry') || lowerFile.includes('dataset') || lowerFile.includes('object_store') || lowerFile.includes('paged')) {
      category = 'Registry & Storage APIs';
    } else if (lowerFile.includes('defense') || lowerFile.includes('security') || lowerFile.includes('rbac') || lowerFile.includes('alert')) {
      category = 'Security & Execution Defense';
    } else if (lowerFile.includes('cluster') || lowerFile.includes('service_discovery') || lowerFile.includes('codemap') || lowerFile.includes('pspoplar') || lowerFile.includes('precision')) {
      category = 'Orchestration & DevOps';
    }

    items.push({
      id,
      filename: file,
      title,
      description,
      category,
      format,
      formatBadge,
      version,
      downloadUrl: `/schemas/${file}`,
      rawContent,
      fields,
      samplePayload,
      propertyCount: fields.length
    });
  }

  // Sort items alphabetically by title
  return items.sort((a, b) => a.title.localeCompare(b.title));
}
