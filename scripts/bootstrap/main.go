package main

import (
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const generatedCVIgnoreRule = "applications/*/cv.html"

func main() {
	log.SetFlags(0)

	if len(os.Args) > 2 {
		log.Fatalf("usage: GO111MODULE=off go run scripts/bootstrap/main.go [repo-root]")
	}

	targetRoot := "."
	if len(os.Args) == 2 {
		targetRoot = os.Args[1]
	}

	repoRoot, err := filepath.Abs(targetRoot)
	if err != nil {
		log.Fatal(err)
	}

	scaffoldDir, err := scaffoldPath()
	if err != nil {
		log.Fatal(err)
	}

	if err := copyScaffold(scaffoldDir, repoRoot); err != nil {
		log.Fatal(err)
	}
	if err := ensureGitignore(repoRoot); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("CV application repository scaffold ready at %s\n", repoRoot)
}

func scaffoldPath() (string, error) {
	_, sourceFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("could not locate bootstrap source")
	}

	skillDir := filepath.Clean(filepath.Join(filepath.Dir(sourceFile), "..", ".."))
	path := filepath.Join(skillDir, "assets", "scaffold")
	if _, err := os.Stat(path); err != nil {
		return "", err
	}
	return path, nil
}

func copyScaffold(scaffoldDir, repoRoot string) error {
	return filepath.WalkDir(scaffoldDir, func(sourcePath string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		rel, err := filepath.Rel(scaffoldDir, sourcePath)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}

		targetPath := filepath.Join(repoRoot, rel)
		if entry.IsDir() {
			return os.MkdirAll(targetPath, 0755)
		}

		if _, err := os.Stat(targetPath); err == nil {
			fmt.Printf("skip existing %s\n", filepath.ToSlash(rel))
			return nil
		} else if !os.IsNotExist(err) {
			return err
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return err
		}
		content, err := os.ReadFile(sourcePath)
		if err != nil {
			return err
		}
		if err := os.WriteFile(targetPath, content, 0644); err != nil {
			return err
		}
		fmt.Printf("create %s\n", filepath.ToSlash(rel))
		return nil
	})
}

func ensureGitignore(repoRoot string) error {
	path := filepath.Join(repoRoot, ".gitignore")
	content, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			if err := os.WriteFile(path, []byte("# Generated CV artifacts\n"+generatedCVIgnoreRule+"\n"), 0644); err != nil {
				return err
			}
			fmt.Println("create .gitignore rule")
			return nil
		}
		return err
	}

	if hasIgnoreRule(string(content), generatedCVIgnoreRule) {
		fmt.Println("skip existing .gitignore rule")
		return nil
	}

	appendix := ""
	if len(content) > 0 {
		if !strings.HasSuffix(string(content), "\n") {
			appendix += "\n"
		}
		appendix += "\n"
	}
	appendix += "# Generated CV artifacts\n" + generatedCVIgnoreRule + "\n"

	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err := file.WriteString(appendix); err != nil {
		return err
	}
	fmt.Println("append .gitignore rule")
	return nil
}

func hasIgnoreRule(content, rule string) bool {
	for _, line := range strings.Split(content, "\n") {
		if strings.TrimSpace(line) == rule {
			return true
		}
	}
	return false
}
