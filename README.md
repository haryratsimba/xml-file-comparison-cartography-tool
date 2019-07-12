# Comparaison de fichiers basés sur une structure XML, et groupage selon leur contenu

## Contexte
Ce script a été écrit dans un contexte où plusieurs fichiers JSP avaient été duppliqués dans différents répertoires, afin de répondre à des besoins spécifiques pour chaque client. L'objectif était de merger les fichiers identiques, ayant le même contenu, dans un dossier commun à tous les clients, et le reste dans des répertoires spécifiques.

## Objectif
Ce script est un POC et permet de comparer plusieurs fichiers, basés sur du XML, censés être plus ou moins identiques, et situés dans le même répertoire. Il peut être adapté pour comparer différents fichiers dans d'autres répertoires. 
Il établit ensuite une **cartographie des similarités entre les fichiers**, en attribuant des groupes à chaque fichier. Les fichiers appartenant au même groupe sont considérés comme identiques.

## Comparaison

La comparison se fait en ignorant les espaces et les commentaires dans les fichiers.

```
{0: 'A', 1: 'B', 2: 'C'}
Chaque item est compose de la maniere suivante : 
clé: indice du fichier parmi les autres fichiers (on ne peut pas utiliser le nom car on suppose qu'ils peuvent avoir le meme nom)
valeur: lettre du groupe (incremental, de A à Z). Si un fichier n'existe pas, il sera attribué au groupe X. Les fichiers appartenant au meme groupe
sont identiques.

On construit une matrice au format:

             Fichier0   Fichier1   Fichier2   Fichier3
Groupe         A           B           C           B

La constitution des groupes se fait par comparaison successives de chaque fichier avec ses pairs afin de déterminer les groupes communs.
Ex avec 7 fichiers portant le même nom (partagé entre plusieurs instances)

Fichier    | 0   1   2   3   4   5   6   7
-----------|-------------------------------
Groupe     | A   B   C   A   D   E   F   G => On compare le fichier 0 avec tous les autres fichiers à l'indice > 0 pour trouver les fichiers similaires et leur attribuer le groupe A, sinon un groupe unique
           |     B   B   A   D   E   F   G => On compare le fichier 1 avec tous les autres fichiers à l'indice > 1 pour trouver les fichiers similaires et leur attribuer le groupe B
           |         B   On skip car le fichier 0 a déjà le même groupe et a été comparé avec les autres fichiers. Le groupe B est déjà constitué
           |             A   On skip car le fichier 2 a déjà le même groupe et a été comparé avec les autres fichiers. Le groupe A est déjà constitué
           |                 D   E   D   D
           |                     Ainsi de suite

Après comparaison successive, on obtient la liste des fichiers et leur groupe :
             A   B   B   A   D   E   D   D

On voit que les fichiers 0 et 3 sont identiques, 1, 2 idem, etc.
```

### Output

L'output est au format JSON :
```json
[
    {"0": "A"}, 
    {"1": "B"}, 
    {"2": "B"},
    {"3": "A"},
    {"4": "D"},
    {"5": "E"},
]
```


## Test
Le script utilise la librairie [html-differ](https://www.npmjs.com/package/html-differ) pour comparer les fichiers JSP, la comparaison peut être faite sur n'importe quel fichier basé sur du XML.

```
npm install
node compare.js
```