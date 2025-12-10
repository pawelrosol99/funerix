# Struktura Bazy Danych (Lokalna Symulacja LocalStorage)

Aplikacja korzysta z `localStorage` przeglądarki jako bazy danych. Poniżej znajduje się lista kluczy (odpowiadających tabelom) oraz struktura przechowywanych w nich obiektów JSON.

---

## 1. Użytkownicy i Autoryzacja

### Tabela: `lively_db_users`
Przechowuje wszystkich użytkowników systemu (Adminów, Właścicieli firm, Pracowników, Klientów).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | Unikalny identyfikator. |
| `client_number` | string | Format 00001 (dla klientów/pracowników). |
| `role` | string | 'super_admin' \| 'client'. |
| `companyRole` | string | 'owner' \| 'employee' \| null. |
| `login` | string | Login unikalny. |
| `password` | string | Hasło. |
| `email` | string | Email (unikalny). |
| `first_name` | string | Imię. |
| `last_name` | string | Nazwisko. |
| `companyId` | UUID | ID firmy (klucz obcy). |
| `branchId` | UUID | ID oddziału (klucz obcy). |
| `vacation_days_total` | number | Pula urlopowa. |
| `vacation_days_used` | number | Wykorzystany urlop. |
| `hourlyRate` | number | Stawka godzinowa (dla panelu pracownika). |
| `photoUrl` | string (Base64/URL) | Zdjęcie profilowe. |
| `preferences` | object | `{ layoutMode: 'sidebar' | 'topbar' }`. |

### Tabela: `lively_db_invitations`
Zaproszenia do dołączenia do firmy wysyłane na email.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID zaproszenia. |
| `email` | string | Email zapraszanego. |
| `companyId` | UUID | Do jakiej firmy. |
| `branchId` | UUID | Do jakiego oddziału (opcjonalne). |
| `status` | string | 'pending' \| 'accepted' \| 'rejected'. |

### Tabela: `lively_db_session`
Aktualna sesja (zamiast ciasteczek).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `userId` | UUID | ID zalogowanego użytkownika. |

### Tabela: `lively_db_notifications`
Powiadomienia systemowe dla użytkowników.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID powiadomienia. |
| `userId` | UUID | Odbiorca powiadomienia. |
| `type` | string | 'info' \| 'success' \| 'warning' \| 'error'. |
| `title` | string | Tytuł. |
| `message` | string | Treść. |
| `isRead` | boolean | Czy przeczytane. |
| `created_at` | ISO Date | Data utworzenia. |

---

## 2. Struktura Firmy

### Tabela: `lively_db_companies`
Główne podmioty (zakłady pogrzebowe).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID firmy. |
| `company_number` | string | Format U00001. |
| `nip` | string | Numer NIP. |
| `name` | string | Nazwa firmy. |
| `package_type` | string | 'basic' \| 'cremation' \| 'funerals' \| 'full'. |
| `address_fields` | string | street, city, zip_code, phone. |

### Tabela: `lively_db_branches`
Oddziały firmy.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID oddziału. |
| `companyId` | UUID | ID firmy matki. |
| `branch_number` | string | Format U00001/1. |
| `name` | string | Nazwa oddziału (np. "Centrum"). |
| `address_fields` | string | street, city, zip_code, phone. |

---

## 3. Moduł Pogrzebowy (Funerals)

### Tabela: `lively_db_funerals`
Główna ewidencja spraw pogrzebowych.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID sprawy. |
| `funeral_number` | string | Format P/Branch/Date/Index. |
| `companyId` | UUID | ID firmy. |
| `branchId` | UUID | ID oddziału. |
| `deceased_*` | string | Dane zmarłego (imię, nazwisko, daty). |
| `applicant_*` | string | Dane zlecającego (imię, nazwisko, tel). |
| `transport_*` | string | Data, czas, adres odbioru. |
| `pickup_place_id` | UUID | ID firmy współpracującej (np. szpital). |
| `ceremony` | object | Złożony obiekt (szczegóły niżej). |
| `saleItems` | array | Lista produktów (`FuneralSaleItem`). |
| `assignedChecklists` | array | Instancje checklist przypisane do sprawy. |
| `assigned_staff_ids`| array[UUID] | ID pracowników obsługujących. |
| `assigned_vehicle_id`| UUID | ID karawanu. |
| `notes` | string | Ważne uwagi. |

**Struktura obiektu `ceremony` w pogrzebie:**
*   `type`: 'burial' | 'cremation'
*   `cremation`: { date, time, placeId, isFamilyPresent, isConfirmed }
*   `farewell`: { active, date, time, placeId }
*   `mass`: { active, date, time, placeId }
*   `cemetery`: { active, date, time, placeId, graveType, graveLocation: { quarter, row, place }, serviceSource }

---

## 4. Moduł Kremacji (Cremations)

### Tabela: `lively_db_cremations`
Techniczna/operacyjna obsługa kremacji (dla krematoriów).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID kremacji. |
| `cremation_number` | string | Format KREM/.... |
| `date` / `time` | string | Termin kremacji. |
| `furnaceId` | UUID | Przypisany piec. |
| `cooperatingCompanyId`| UUID | Zakład pogrzebowy zlecający. |
| `selectedOptions` | array[UUID] | Wybrane opcje (np. urna, pożegnanie). |
| `items` | array | Produkty zużyte (`CremationItem`). |
| `isPaid` | boolean | Status płatności. |
| `history` | array | Logi zmian statusu. |

### Tabela: `lively_db_furnaces`
Piece kremacyjne.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID pieca. |
| `name` | string | Nazwa. |
| `color` | string | Kolor w kalendarzu (HEX). |

### Tabela: `lively_db_cremation_groups` & `lively_db_cremation_options`
Konfiguracja opcji dodatkowych (np. "Rodzaj urny", "Muzyka").

---

## 5. Magazyn i Produkty

### Tabela: `lively_db_warehouse_cats`
Drzewo kategorii produktów i usług.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID kategorii. |
| `parentId` | UUID | ID rodzica (dla podkategorii). |
| `type` | string | 'product' \| 'service'. |
| `name` | string | Nazwa. |

### Tabela: `lively_db_warehouse_items`
Produkty i usługi.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `id` | UUID | ID elementu. |
| `categoryId` | UUID | Kategoria. |
| `subCategoryId` | UUID | Podkategoria. |
| `type` | string | 'product' \| 'service'. |
| `name` | string | Nazwa. |
| `photoUrl` | string | Zdjęcie. |
| `salesPrice` | number | Cena sprzedaży (brutto). |
| `purchasePrice` | number | Cena zakupu. |
| `quantity` | number | Stan magazynowy. |
| `unit` | string | Jednostka (dla usług). |
| `manufacturer` | string | Nazwa producenta. |

### Tabela: `lively_db_relations`
Powiązania (zestawy) produktów ułatwiające wybór w kreatorze pogrzebu (np. "Urny").

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `name` | string | Nazwa powiązania. |
| `categoryIds` | array[UUID] | Lista kategorii magazynowych wchodzących w skład. |

---

## 6. Kadry i Płace

### Tabela: `lively_db_work_sessions`
Rejestracja czasu pracy (RCP).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `userId` | UUID | Pracownik. |
| `startTime` | ISO Date | Start pracy. |
| `endTime` | ISO Date | Koniec pracy. |
| `status` | string | 'active', 'completed', 'pending_approval' (gdy edytowano ręcznie). |
| `edited*` | ISO Date | Proponowane czasy przy edycji. |

### Tabela: `lively_db_payroll_bonuses`
Definicje dodatków płacowych (np. "Premia uznaniowa").

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `name` | string | Nazwa dodatku. |
| `amount` | number | Kwota domyślna. |

### Tabela: `lively_db_user_bonuses`
Historia przyznanych dodatków konkretnym pracownikom.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `userId` | UUID | Pracownik. |
| `bonusId` | UUID | ID definicji dodatku. |
| `amount` | number | Kwota przyznana. |
| `timestamp` | ISO Date | Data przyznania. |

---

## 7. Flota i Logistyka

### Tabela: `lively_db_vehicles`
Pojazdy firmowe.

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `model` | string | Model pojazdu. |
| `manufacturer` | string | Producent. |
| `fuelType` | string | Rodzaj paliwa. |
| `inspectionDate` | ISO Date | Data przeglądu. |
| `technicalDate` | ISO Date | Data badania technicznego. |

---

## 8. Kontrahenci i Dokumenty

### Tabela: `lively_db_coop_companies`
Baza firm zewnętrznych (szpitale, cmentarze, kwiaciarnie).

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `tagId` | UUID | Kategoria firmy (np. Kwiaciarnia). |
| `nip`, `name`... | string | Dane teleadresowe. |

### Tabela: `lively_db_drivers`
Kierowcy przypisani do firm zewnętrznych (dla firm transportowych).

### Tabela: `lively_db_company_tags`
Tagi/Kategorie dla firm współpracujących (wraz z kolorami).

### Tabela: `lively_db_doc_templates`
Szablony dokumentów (HTML/JSON layers).

### Tabela: `lively_db_checklists`
Szablony list zadań do wykonania przy pogrzebie.

### Tabela: `lively_db_manufacturers`
Globalna baza producentów trumien/urn (dostępna dla Admina).

### Tabela: `lively_db_themes`
Motywy wizualne aplikacji (zmienne CSS).
