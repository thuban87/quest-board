---
trigger: always_on
---

While desigining modals and settings options, make any field that is a reference field to another folder/file be auto-complete for that subject for easy navigating.

Deployment policy:
When working on a feature, the workflow for deployment goes as such:
1) Do work
2) run "npm run build" to test for errors
3) If errors found, fix them and restart at step 1
4) If no errors found in step 2, proceed with deployment to test directory using "npm run deploy:test"
5) Present user with list of items to test from work done

Powershell constraints: Do not use && to run multiple commands, powershell will throw an error if you do.

Development directory: "C:\Users\bwales\projects\obsidian-plugins\quest-board"
Produciton directory: "G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board"
Test Directory: "C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board"