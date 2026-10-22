# The Boyz

Le site des plans du groupe : on lance un plan, chacun dit s'il est chaud, tout le monde voit qui vient en direct.

Stack et base de données : voir [../TECHNOLOGIES.md](../TECHNOLOGIES.md). Charte graphique : [../charte-graphique/](../charte-graphique/).

## Ce qui marche aujourd'hui (MVP)

- Inscription et connexion par e-mail et mot de passe, mot de passe oublié.
- Profil : pseudo, photo et couleur d'avatar.
- Création du groupe, lien d'invitation, page « Le groupe ».
- Lancer un plan (vibe, date ou « à décider », lieu, adresse, infos, places), le modifier, l'annuler, le supprimer.
- Répondre chaud / peut-être / pas dispo, avec une limite de places.
- Accueil (plan du jour, plus tard, idées sans date), agenda par mois, page d'un plan avec les réponses en temps réel.
- Thème clair / sombre / auto.

## Mise en route

### 1. Créer le projet Supabase (une fois)

1. Crée un compte sur [supabase.com](https://supabase.com) puis un projet, région **Europe** (Paris ou Francfort).
2. Dans **SQL Editor**, colle et lance [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql), puis [0002_lien_image.sql](supabase/migrations/0002_lien_image.sql).
3. Dans **Authentication > URL Configuration** :
   - Site URL : `http://localhost:3000` (à remplacer par l'adresse Vercel une fois en ligne).
   - Redirect URLs : ajoute `http://localhost:3000/**` (et plus tard `https://ton-site.vercel.app/**`).
4. Dans **Authentication > Sign In / Providers > Email** : laisse « Email » activé. « Confirm email » activé = chaque nouveau doit cliquer un lien reçu par e-mail avant de pouvoir se connecter ; désactivé = le compte marche tout de suite.
   Dans **Authentication > Email Templates**, remplace le contenu de :
   - **Confirm signup** par [supabase/templates/confirm-signup.html](supabase/templates/confirm-signup.html)
   - **Reset Password** par [supabase/templates/reset-password.html](supabase/templates/reset-password.html)

   Ces modèles font marcher les liens même s'ils s'ouvrent dans un autre navigateur que le site (appli mail du téléphone).
5. Dans **Project Settings > API Keys**, copie l'URL du projet et la clé *publishable*.

> L'e-mail intégré de Supabase est limité à quelques envois par heure. Pour un groupe de potes ça passe ; sinon, branche un SMTP (Resend, Brevo…) dans **Authentication > SMTP Settings**.

### 2. Lancer le site en local

```bash
cp .env.example .env.local   # puis remplis les deux valeurs
pnpm install
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000). Le premier qui se connecte crée le groupe « The Boyz » et partage le lien d'invitation depuis l'onglet **Le groupe**.

### 3. Mettre en ligne (Vercel)

1. Pousse le dépôt sur GitHub, importe-le sur [vercel.com](https://vercel.com).
2. Ajoute les deux variables `NEXT_PUBLIC_SUPABASE_*` dans les réglages du projet Vercel.
3. Dans Supabase, mets l'adresse Vercel en Site URL et dans les Redirect URLs.

## Organisation du code

```text
app/
  (app)/            pages de l'app (connecté + membre du groupe) : accueil, agenda, groupe, moi, plans
  actions/          server actions : auth, profil, groupe, plans
  auth/callback/    arrivée depuis le lien de l'e-mail
  connexion/, bienvenue/, rejoindre/   parcours d'entrée
  styles/           tokens.css et components.css, copiés de la charte
components/         composants de la charte en React (ticket, liste, réponses, avatars…)
lib/
  data.ts           lectures en base + gardes d'accès (requireMember…)
  format.ts         dates à l'heure de Paris, euros
  supabase/         clients serveur et navigateur
proxy.ts            rafraîchit la session, renvoie vers /connexion si besoin
supabase/migrations/ schéma SQL
```

Toutes les règles d'accès sont dans la base (Row Level Security) : même en contournant l'interface, on ne voit que les plans de son groupe.

## Commandes

| Commande | Effet |
| --- | --- |
| `pnpm dev` | serveur de dev |
| `pnpm build` | build de production |
| `pnpm lint` | ESLint |
