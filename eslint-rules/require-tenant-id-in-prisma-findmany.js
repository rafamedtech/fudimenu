"use strict";

function isTargetServerFile(filename) {
  return filename.replaceAll("\\", "/").includes("/src/server/");
}

function getPropertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return null;
}

function hasObjectProperty(objectExpression, propertyName) {
  return objectExpression.properties.some((property) => {
    if (property.type !== "Property") return false;
    return getPropertyName(property.key) === propertyName;
  });
}

function hasWhereTenantId(callExpression) {
  const [firstArg] = callExpression.arguments;
  if (!firstArg || firstArg.type !== "ObjectExpression") return false;

  const whereProperty = firstArg.properties.find((property) => {
    if (property.type !== "Property") return false;
    return getPropertyName(property.key) === "where";
  });

  return Boolean(
    whereProperty &&
      whereProperty.type === "Property" &&
      whereProperty.value.type === "ObjectExpression" &&
      hasObjectProperty(whereProperty.value, "tenantId"),
  );
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require tenantId in Prisma findMany where filters under src/server.",
    },
    schema: [],
    messages: {
      missingTenantId:
        "Prisma findMany in src/server must include where.tenantId, or add an eslint-disable comment with the security reason.",
    },
  },

  create(context) {
    if (!isTargetServerFile(context.getFilename())) {
      return {};
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type !== "MemberExpression" ||
          getPropertyName(node.callee.property) !== "findMany"
        ) {
          return;
        }

        if (!hasWhereTenantId(node)) {
          context.report({ node, messageId: "missingTenantId" });
        }
      },
    };
  },
};
