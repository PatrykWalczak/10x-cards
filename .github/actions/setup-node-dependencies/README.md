# Setup Node.js and Dependencies

Wspólna akcja do konfiguracji środowiska Node.js i instalacji dependencji.

## Użycie

```yaml
- name: Setup Node.js and Dependencies
  uses: ./.github/actions/setup-node-dependencies
```

## Funkcjonalności

- Checkout kodu z repozytorium
- Konfiguracja Node.js zgodnie z wersją z pliku `.nvmrc`
- Konfiguracja cache dla npm
- Instalacja dependencji przez `npm ci`

## Wymagania

- Plik `.nvmrc` w katalogu głównym projektu
- Plik `package-lock.json` dla prawidłowego działania cache
