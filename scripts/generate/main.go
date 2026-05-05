package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type Config struct {
	SchemaVersion int         `json:"schemaVersion"`
	Template      string      `json:"template"`
	Application   Application `json:"application"`
	CV            CV          `json:"cv"`
}

type Application struct {
	Slug    string `json:"slug"`
	Company string `json:"company"`
	Role    string `json:"role"`
}

type CV struct {
	Candidate    Candidate       `json:"candidate"`
	Summary      string          `json:"summary"`
	Experience   []Company       `json:"experience"`
	SideProjects []SideProject   `json:"sideProjects"`
	Education    Education       `json:"education"`
	Skills       []SkillCategory `json:"skills"`
	Languages    []Language      `json:"languages"`
}

type Candidate struct {
	Name     string `json:"name"`
	Location string `json:"location"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Photo    string `json:"photo"`
	Links    []Link `json:"links"`
}

type Link struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

type Company struct {
	Name        string `json:"name"`
	Location    string `json:"location"`
	Description string `json:"description"`
	Roles       []Role `json:"roles"`
}

type Role struct {
	Title  string   `json:"title"`
	Period string   `json:"period"`
	Items  []string `json:"items"`
}

type SideProject struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Link        Link   `json:"link"`
}

type Education struct {
	Degree string `json:"degree"`
	School string `json:"school"`
	Period string `json:"period"`
}

type SkillCategory struct {
	Name  string   `json:"name"`
	Items []string `json:"items"`
}

type Language struct {
	Name  string `json:"name"`
	Level string `json:"level"`
}

type viewModel struct {
	Config
	PhotoSrc string
}

func main() {
	log.SetFlags(0)

	if len(os.Args) != 2 {
		log.Fatalf("usage: GO111MODULE=off go run scripts/generate/main.go applications/<slug>/config.json")
	}

	configPath, err := filepath.Abs(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}

	config, err := readConfig(configPath)
	if err != nil {
		log.Fatal(err)
	}

	if config.Template == "" {
		config.Template = "default"
	}
	if err := validate(config); err != nil {
		log.Fatal(err)
	}

	templatePath, err := templatePath(config.Template)
	if err != nil {
		log.Fatal(err)
	}

	outputPath := filepath.Join(filepath.Dir(configPath), "cv.html")
	photoSrc := ""
	if strings.TrimSpace(config.CV.Candidate.Photo) != "" {
		photoPath := resolvePath(filepath.Dir(configPath), config.CV.Candidate.Photo)
		if _, err := os.Stat(photoPath); err != nil {
			log.Fatalf("cv.candidate.photo %q: %v", config.CV.Candidate.Photo, err)
		}
		photoSrc, err = outputRelativePath(filepath.Dir(configPath), photoPath)
		if err != nil {
			log.Fatal(err)
		}
	}

	tmpl, err := template.New(filepath.Base(templatePath)).Funcs(template.FuncMap{
		"join": strings.Join,
	}).ParseFiles(templatePath)
	if err != nil {
		log.Fatal(err)
	}

	out, err := os.Create(outputPath)
	if err != nil {
		log.Fatal(err)
	}
	defer out.Close()

	if err := tmpl.Execute(out, viewModel{Config: config, PhotoSrc: photoSrc}); err != nil {
		log.Fatal(err)
	}

	fmt.Println(outputPath)
}

func readConfig(path string) (Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return Config{}, err
	}
	defer file.Close()

	var config Config
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&config); err != nil {
		return Config{}, err
	}
	return config, nil
}

func validate(config Config) error {
	var problems []string
	require := func(ok bool, msg string) {
		if !ok {
			problems = append(problems, msg)
		}
	}

	require(config.SchemaVersion == 1, "schemaVersion must be 1")
	require(cleanName(config.Template), "template must be a simple directory name")
	require(config.Application.Slug != "", "application.slug is required")
	require(config.Application.Company != "", "application.company is required")
	require(config.Application.Role != "", "application.role is required")
	require(config.CV.Candidate.Name != "", "cv.candidate.name is required")
	require(config.CV.Candidate.Location != "", "cv.candidate.location is required")
	require(config.CV.Candidate.Email != "", "cv.candidate.email is required")
	require(config.CV.Candidate.Phone != "", "cv.candidate.phone is required")
	require(config.CV.Summary != "", "cv.summary is required")
	require(len(config.CV.Experience) > 0, "cv.experience must not be empty")
	require(config.CV.Education.School != "", "cv.education.school is required")
	require(config.CV.Education.Degree != "", "cv.education.degree is required")
	require(len(config.CV.Skills) > 0, "cv.skills must not be empty")
	require(len(config.CV.Languages) > 0, "cv.languages must not be empty")

	for i, link := range config.CV.Candidate.Links {
		require(link.Label != "", fmt.Sprintf("cv.candidate.links[%d].label is required", i))
		require(link.URL != "", fmt.Sprintf("cv.candidate.links[%d].url is required", i))
	}
	for i, company := range config.CV.Experience {
		require(company.Name != "", fmt.Sprintf("cv.experience[%d].name is required", i))
		require(len(company.Roles) > 0, fmt.Sprintf("cv.experience[%d].roles must not be empty", i))
		for j, role := range company.Roles {
			require(role.Title != "", fmt.Sprintf("cv.experience[%d].roles[%d].title is required", i, j))
			require(role.Period != "", fmt.Sprintf("cv.experience[%d].roles[%d].period is required", i, j))
			require(len(role.Items) > 0, fmt.Sprintf("cv.experience[%d].roles[%d].items must not be empty", i, j))
		}
	}
	for i, skill := range config.CV.Skills {
		require(skill.Name != "", fmt.Sprintf("cv.skills[%d].name is required", i))
		require(len(skill.Items) > 0, fmt.Sprintf("cv.skills[%d].items must not be empty", i))
	}
	for i, language := range config.CV.Languages {
		require(language.Name != "", fmt.Sprintf("cv.languages[%d].name is required", i))
		require(language.Level != "", fmt.Sprintf("cv.languages[%d].level is required", i))
	}

	if len(problems) > 0 {
		return fmt.Errorf("invalid config:\n- %s", strings.Join(problems, "\n- "))
	}
	return nil
}

func cleanName(name string) bool {
	return name != "" && !strings.Contains(name, "..") && !strings.ContainsAny(name, `/\`)
}

func templatePath(name string) (string, error) {
	_, sourceFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("could not locate generator source")
	}

	skillDir := filepath.Clean(filepath.Join(filepath.Dir(sourceFile), "..", ".."))
	path := filepath.Join(skillDir, "assets", "templates", name, "cv.html.tmpl")
	if _, err := os.Stat(path); err != nil {
		return "", err
	}
	return path, nil
}

func outputRelativePath(outputDir, target string) (string, error) {
	rel, err := filepath.Rel(outputDir, resolvePath(outputDir, target))
	if err != nil {
		return "", err
	}
	return filepath.ToSlash(rel), nil
}

func resolvePath(baseDir, target string) string {
	if filepath.IsAbs(target) {
		return target
	}
	return filepath.Join(baseDir, target)
}
