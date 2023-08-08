import {
    Frame,
    Navigation,
    Page,
    HorizontalStack,
    LegacyCard,
    IndexTable,
    useIndexResourceState,
    Text,
} from "@shopify/polaris";
import {
    OrdersMajor,
    InventoryMajor,
    ShipmentFilledMajor,
} from "@shopify/polaris-icons";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import shopify from "../shopify.server.js";
import { json } from "@remix-run/node";

export async function loader({ request }) {
    const { admin } = await shopify.authenticate.admin(request);
    const response = await admin.graphql(`
    {
        orders(first: 10) {
            edges {
                node {
                    name
                    id
                    createdAt
                    fullyPaid
                    unpaid
                    tags
                    subtotalPriceSet {
                        presentmentMoney {
                            amount
                        }
                    }
                    customer {
                        firstName
                        lastName
                    }
                }
            }
        }
    }`);
    const {
        data: {
            orders: { edges },
        },
    } = await response.json();

    return json(edges);
}

export default function TrackingPage() {
    const orders = useLoaderData();
    const resourceName = {
        singular: "order",
        plural: "orders",
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(orders);

    const rowMarkup = orders.map(
        (
            {
                node: {
                    id,
                    name,
                    createdAt,
                    customer,
                    subtotalPriceSet,
                    paymentStatus,
                    fullyPaid,
                    unpaid,
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
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {name}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{createdAt}</IndexTable.Cell>
                <IndexTable.Cell>
                    {customer.firstName} {customer.lastName}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    ${subtotalPriceSet.presentmentMoney.amount}
                </IndexTable.Cell>
                {fullyPaid === true && unpaid === false ? (
                    <IndexTable.Cell>Paid</IndexTable.Cell>
                ) : fullyPaid === false && unpaid === true ? (
                    <IndexTable.Cell>Unpaid</IndexTable.Cell>
                ) : (
                    <IndexTable.Cell>Partially paid</IndexTable.Cell>
                )}
            </IndexTable.Row>
        )
    );

    return (
        <Page>
            <Frame>
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
                                },
                                {
                                    url: "/app/tracking",
                                    label: "Tracking Information",
                                    icon: ShipmentFilledMajor,
                                    matches: true,
                                },
                            ]}
                        />
                    </Navigation>
                    <LegacyCard>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={orders.length}
                            selectedItemsCount={
                                allResourcesSelected ? "All" : selectedResources.length
                            }
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: "Order" },
                                { title: "Created Date" },
                                { title: "Customer" },
                                { title: "Total", alignment: "end" },
                                { title: "Payment status" },
                            ]}
                        >
                            {rowMarkup}
                        </IndexTable>
                    </LegacyCard>
                </HorizontalStack>
            </Frame>
        </Page>
    );
}
