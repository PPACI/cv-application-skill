#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const Handlebars = require("handlebars");
const { z } = require("zod");

const strictObject = (shape) => z.object(shape).strict();
const requiredString = z.string().min(1);
const requiredList = (itemSchema) => z.array(itemSchema).min(1);
const requiredStringArray = requiredList(requiredString);

const defaultWhenNil = (fallback) => (value) =>
  value === undefined || value === null ? fallback : value;
const optionalString = z.preprocess(defaultWhenNil(""), z.string());
const optionalArray = (itemSchema) =>
  z.preprocess(defaultWhenNil([]), z.array(itemSchema));
const optionalObject = (objectSchema, fallback) =>
  z.preprocess(defaultWhenNil(fallback), objectSchema);

const templateName = z.preprocess(
  (value) =>
    value === undefined || value === null || value === "" ? "default" : value,
  z.string().refine(cleanName, "template must be a simple directory name"),
);

const LinkSchema = strictObject({ label: requiredString, url: requiredString });
const OptionalLinkSchema = strictObject({
  label: optionalString,
  url: optionalString,
});
const ApplicationSchema = strictObject({
  slug: requiredString,
  company: requiredString,
  role: requiredString,
});
const CandidateSchema = strictObject({
  name: requiredString,
  location: requiredString,
  email: requiredString,
  phone: requiredString,
  photo: optionalString,
  links: optionalArray(LinkSchema),
});
const RoleSchema = strictObject({
  title: requiredString,
  period: requiredString,
  items: requiredStringArray,
});
const CompanySchema = strictObject({
  name: requiredString,
  location: optionalString,
  description: optionalString,
  roles: requiredList(RoleSchema),
});
const SideProjectSchema = strictObject({
  title: optionalString,
  description: optionalString,
  link: optionalObject(OptionalLinkSchema, {}),
});
const EducationSchema = strictObject({
  degree: requiredString,
  school: requiredString,
  period: optionalString,
});
const SkillSchema = strictObject({
  name: requiredString,
  items: requiredStringArray,
});
const LanguageSchema = strictObject({
  name: requiredString,
  level: requiredString,
});
const CVSchema = strictObject({
  candidate: CandidateSchema,
  summary: requiredString,
  experience: requiredList(CompanySchema),
  sideProjects: optionalArray(SideProjectSchema),
  education: EducationSchema,
  skills: requiredList(SkillSchema),
  languages: requiredList(LanguageSchema),
});
const ConfigSchema = strictObject({
  schemaVersion: z.literal(1),
  template: templateName,
  application: ApplicationSchema,
  cv: CVSchema,
});

Handlebars.registerHelper("join", (items, separator) =>
  Array.isArray(items) ? items.join(separator) : "",
);

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    throw new Error(
      "usage: node scripts/generate/main.js applications/<slug>/config.json",
    );
  }

  const configPath = path.resolve(args[0]);
  const config = parseConfig(readConfig(configPath));
  const viewModel = buildViewModel(config, configPath);
  const templatePath = getTemplatePath(config.template);
  const outputPath = path.join(path.dirname(configPath), "cv.html");

  const template = fs.readFileSync(templatePath, "utf8");
  const html = Handlebars.compile(template)(viewModel);
  fs.writeFileSync(outputPath, html, { mode: 0o644 });

  console.log(outputPath);
}

function readConfig(targetPath) {
  const content = fs.readFileSync(targetPath, "utf8");
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`${targetPath}: ${error.message}`);
  }
}

function parseConfig(rawConfig) {
  const result = ConfigSchema.safeParse(rawConfig);
  if (result.success) {
    return result.data;
  }

  throw new Error(
    `invalid config:\n- ${formatZodIssues(result.error.issues).join("\n- ")}`,
  );
}

function buildViewModel(config, configPath) {
  const configDir = path.dirname(configPath);

  return {
    ...config,
    photoSrc: resolvePhoto(config.cv.candidate.photo, configDir),
    cv: {
      ...config.cv,
      sideProjects: config.cv.sideProjects.map((project) => ({
        ...project,
        link: {
          ...project.link,
          text: project.link.label || project.link.url,
        },
      })),
    },
  };
}

function resolvePhoto(photo, configDir) {
  if (photo.trim() === "") {
    return "";
  }

  const photoPath = resolvePath(configDir, photo);
  try {
    fs.statSync(photoPath);
  } catch (error) {
    throw new Error(
      `cv.candidate.photo ${JSON.stringify(photo)}: ${error.message}`,
    );
  }

  return toSlash(path.relative(configDir, photoPath));
}

function formatZodIssues(issues) {
  return issues.flatMap((issue) => {
    const field = formatPath(issue.path);

    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => `unknown field ${appendPath(field, key)}`);
    }

    if (issue.code === "invalid_value" && field === "schemaVersion") {
      return "schemaVersion must be 1";
    }

    if (issue.code === "too_small") {
      return issue.origin === "array"
        ? `${field} must not be empty`
        : `${field} is required`;
    }

    if (issue.code === "invalid_type") {
      return formatTypeIssue(issue, field);
    }

    return issue.message.startsWith(field)
      ? issue.message
      : `${field}: ${issue.message}`;
  });
}

function formatTypeIssue(issue, field) {
  const missing = issue.message.includes("received undefined");
  if (issue.expected === "object") {
    return `${field} must be an object`;
  }
  if (issue.expected === "array") {
    return missing ? `${field} must not be empty` : `${field} must be an array`;
  }
  if (issue.expected === "string") {
    return missing ? `${field} is required` : `${field} must be a string`;
  }
  return `${field}: ${issue.message}`;
}

function formatPath(parts) {
  if (parts.length === 0) {
    return "config";
  }

  return parts.reduce((result, part) => {
    if (typeof part === "number") {
      return `${result}[${part}]`;
    }
    return result ? `${result}.${part}` : part;
  }, "");
}

function appendPath(base, part) {
  return base === "config" ? `config.${part}` : `${base}.${part}`;
}

function cleanName(name) {
  return (
    typeof name === "string" &&
    name !== "" &&
    !name.includes("..") &&
    !name.includes("/") &&
    !name.includes("\\")
  );
}

function getTemplatePath(name) {
  const skillDir = path.resolve(__dirname, "..", "..");
  const targetPath = path.join(
    skillDir,
    "assets",
    "templates",
    name,
    "cv.html.hbs",
  );
  fs.statSync(targetPath);
  return targetPath;
}

function resolvePath(baseDir, target) {
  return path.isAbsolute(target) ? target : path.join(baseDir, target);
}

function toSlash(targetPath) {
  return targetPath.split(path.sep).join("/");
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
