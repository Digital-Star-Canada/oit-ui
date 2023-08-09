import {
    Frame,
    Navigation,
    Page,
    HorizontalStack,
    LegacyCard,
    IndexTable,
    useIndexResourceState,
    Text,
    Button,
} from "@shopify/polaris";
import {
    OrdersMajor,
    InventoryMajor,
    ShipmentFilledMajor,
} from "@shopify/polaris-icons";
import { useLoaderData } from "@remix-run/react";
import React, {useState} from "react";
import shopify from "../shopify.server.js";
import { json } from "@remix-run/node";

export async function loader({ request }) {
    const { admin } = await shopify.authenticate.admin(request);
    const response = await admin.graphql(`
    {
        productVariants(first: 250) {
            edges {
                node {
                    id
                    title
                    sku
                    availableForSale
                    price
                    inventoryQuantity
                    displayName
                    updatedAt
                }
            }
        }
    }`);
    const {
        data: {
            productVariants: { edges },
        },
    } = await response.json();

    return json(edges);
}

export default function InventoryPage() {
    const variants = useLoaderData();
    const renderVariants = variants.filter((renderVariant) => {
        return renderVariant.node.inventoryQuantity < 50;
    });

    const resourceName = {
        singular: "variant",
        plural: "variants",
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(renderVariants);

    const rowMarkup = renderVariants.map(
        (
            {
                node: {
                    id,
                    title,
                    sku,
                    availableForSale,
                    price,
                    inventoryQuantity,
                    displayName,
                    updatedAt,
                },
            },
            index
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell className="Index-Table-Cell_Product-variant_Width">
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {displayName}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{sku}</IndexTable.Cell>
                <IndexTable.Cell>{updatedAt}</IndexTable.Cell>
                <IndexTable.Cell>
                    ${price}
                </IndexTable.Cell>
                {availableForSale? (<IndexTable.Cell>Yes</IndexTable.Cell>) : (<IndexTable.Cell>No</IndexTable.Cell>)}
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {inventoryQuantity}
                    </Text>
                </IndexTable.Cell>
            </IndexTable.Row>
        )
        
    );

    const product_variant_cell_styles = `
        .Index-Table-Cell_Product-variant_Width{
            max-width: 100px;
            overflow-x: auto;
        }
    `;

    return (
        <>
        <style>
            {product_variant_cell_styles}
        </style>
        <Page>
            <Frame>
                <HorizontalStack gap="3" align="end">
                    <Button primary>
                        Filter
                    </Button>
                </HorizontalStack>
                <HorizontalStack wrap={false} align="center">
                    <Navigation location="/">
                        <Navigation.Section
                            items={[
                                {
                                    url: "/app",
                                    label: "Orders",
                                    icon: OrdersMajor,
                                },
                                {
                                    url: "/app/inventory",
                                    label: "Product Inventory",
                                    icon: InventoryMajor,
                                    matches: true,
                                },
                                {
                                    url: "/app/tracking",
                                    label: "Tracking Information",
                                    icon: ShipmentFilledMajor,
                                },
                            ]}
                        />
                    </Navigation>
                    <LegacyCard>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={renderVariants.length}
                            selectedItemsCount={
                                allResourcesSelected ? "All" : selectedResources.length
                            }
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: "Product variant" },
                                { title: "SKU" },
                                { title: "Last update date" },
                                { title: "Price", alignment: "end"},
                                { title: "Available for sale"},
                                { title: "Inventory"},
                            ]}
                        >
                            {rowMarkup}
                        </IndexTable>
                    </LegacyCard>
                </HorizontalStack>
            </Frame>
        </Page>
        </>
    );
}
