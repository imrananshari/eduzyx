UPDATE "SchoolBranch"
SET "type" = 'branch',
    "isMain" = false
WHERE "type" = 'main campus' OR "isMain" = true;
