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
        orders(first: 250) {
            edges {
                node {
                    name
                    id
                    createdAt
                    fullyPaid
                    unpaid
                    tags
                    cancelledAt
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

export default function Index() {
    const orders = useLoaderData();
    const [renderOrders, setRenderOrders] = useState([]);
    const [filterButton, setFilterButton] = useState(false);
    if (orders !== renderOrders && filterButton === false) {
        setRenderOrders(orders);
    }
    const resourceName = {
        singular: "order",
        plural: "orders",
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(renderOrders);

    const rowMarkup = renderOrders.map(
        (
            {
                node: {
                    id,
                    name,
                    createdAt,
                    customer,
                    subtotalPriceSet,
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

    const filterControl = () => {
        const filteredOrders = orders.filter((renderOrder) => {
            return renderOrder.node.tags.includes("Ready to Sync");
        }).filter((renderOrder) => {
            return renderOrder.node.cancelledAt === null;
        });
        setRenderOrders(filteredOrders);
        setFilterButton(true);
    }

    return (
        <Page>
            <Frame>
                <HorizontalStack gap="3" align="end">
                    <Button primary onClick={filterControl}>
                        Filter
                    </Button>
                </HorizontalStack>
                <HorizontalStack wrap={false} align="end">
                    <Navigation location="/">
                        <Navigation.Section
                            items={[
                                {
                                    url: "/app",
                                    label: "Orders",
                                    icon: OrdersMajor,
                                    matches: true,
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
                                },
                            ]}
                        />
                    </Navigation>
                    <LegacyCard>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={renderOrders.length}
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
