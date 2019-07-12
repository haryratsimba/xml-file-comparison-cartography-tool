const {
    existsSync,
    readdirSync,
    readFileSync,
    lstatSync,
    writeFile
} = require('fs');

const {
    join
} = require('path');

// https://www.npmjs.com/package/html-differ
const {HtmlDiffer} = require('html-differ');
const logger = require('html-differ/lib/logger');

const options = {
    ignoreAttributes: [],
    compareAttributesAsJSON: [],
    ignoreWhitespaces: true,
    ignoreComments: true,
    ignoreEndTags: false,
    ignoreDuplicateAttributes: false
};

const htmlDiffer = new HtmlDiffer(options);

/**
 * Dossier contenant les fichiers à comparer.
 */
const base_dir = join(__dirname, 'comparison_dir');

/*
 * {0: 'A', 1: 'B', 2: 'C'}
 * Chaque item est compose de la maniere suivante : 
 * clé: indice du fichier parmi les autres fichiers (on ne peut pas utiliser le nom car on suppose qu'ils peuvent avoir le meme nom)
 * valeur: lettre du groupe (incremental, de A à Z). Si un fichier n'existe pas, il sera attribué au groupe X. Les fichiers appartenant au meme groupe
 * sont identiques.
 * 
 * On construit une matrice au format:
 * 
 *              Fichier0   Fichier1   Fichier2   Fichier3
 * Groupe         A           B           C           B
 * 
 * La constitution des groupes se fait par comparaison successives de chaque fichier avec ses pairs afin de déterminer les groupes communs.
 * Ex avec 7 fichiers portant le même nom (partagé entre plusieurs instances)
 * 
 * Fichier    | 0   1   2   3   4   5   6   7
 * -----------|-------------------------------
 * Groupe     | A   B   C   A   D   E   F   G => On compare le fichier 0 avec tous les autres fichiers à l'indice > 0 pour trouver les fichiers similaires et leur attribuer le groupe A, sinon un groupe unique
 *            |     B   B   A   D   E   F   G => On compare le fichier 1 avec tous les autres fichiers à l'indice > 1 pour trouver les fichiers similaires et leur attribuer le groupe B
 *            |         B   On skip car le fichier 0 a déjà le même groupe et a été comparé avec les autres fichiers. Le groupe B est déjà constitué
 *            |             A   On skip car le fichier 2 a déjà le même groupe et a été comparé avec les autres fichiers. Le groupe A est déjà constitué
 *            |                 D   E   D   D
 *            |                     Ainsi de suite
 * 
 * Après comparaison successive, on obtient la liste des fichiers et leur groupe :
 *              A   B   B   A   D   E   D   D
 * 
 * On voit que les fichiers 0 et 3 sont identiques, 1, 2 idem, etc.
 */

const groups = {
    /* 0: A,
     * 1: B,
     * 2: C
     */
};
// Code UTF-16 correspondant à la lettre d'id d'un groupe. Commence à 65 (A) et s'incremente lorsq'un nouveau groupe est créé
let lastGroupCharAt = 65;
readdirSync(base_dir).forEach((file, i, files) => {
    // Si le fichier a déjà un groupe et fait partie du même groupe que l'un des fichiers traites précedemment
    // on skip, ex : 2 = 1 (groupe B), on skip car le fichier indice 1 a déjà été comparé à tous les autres fichiers, on ne refait pas la comparaison
    // avec le fichier indice 2
    if(i > 0 && groups[i] && !!Object.entries(groups).find(([pos, group]) => parseInt(pos) < i && groups[i] == group)) {
        console.log(`Skip le fichier a l'index ${i} car le groupe ${groups[i]} est déjà constitué`);
        // continue
        return;
    }

    // Attribution du groupe si celui-ci n'existe pas pour le fichier / indice courant
    // ex : 1er fichier (indice 0) => groupe A
    if(!groups[i]) {
        groups[i] = String.fromCharCode(lastGroupCharAt);
    }

    // Chaque fichier sera identifie par son indice dans la liste des fichiers de l'instance car ils ont tous le meme nom
    // On compare chaque fichier non repertorié comme etant egal a un autre fichier avec tous les autres fichiers à l'indice > j
    for(let j = (i + 1)  ; j < files.length ; j++) {
        const currentFile = readFileSync(join(base_dir, file), 'utf-8');
        
        const nextFilePath = join(base_dir, files[j]);
        if(existsSync(nextFilePath)) {
            const nextFile = readFileSync(nextFilePath, 'utf-8');
            
            const isEqual = htmlDiffer.isEqual(currentFile, nextFile);
            if(isEqual) {
                // Même groupe
                groups[j] = groups[i];
            } else {
                if(!groups[j]) {
                    // On attribue un groupe different du groupe i si non defini pour le fichier indice i+1
                    groups[j] = String.fromCharCode(++lastGroupCharAt);
                }
                
                console.log('Diff : ', file, nextFilePath);
                const diff = htmlDiffer.diffHtml(currentFile, nextFile);
                logger.logDiffText(diff, { charsAroundDiff: 40 });
            }
        } else {
            // Aucun groupe car le fichier n'existe pas
            groups[j] = 'X';
            console.log(`Le fichier à l'index ${j} n'existe pas`); 
        }
    }

});

// On reset le group
lastGroupCharAt = 65;

console.log(JSON.stringify(groups));